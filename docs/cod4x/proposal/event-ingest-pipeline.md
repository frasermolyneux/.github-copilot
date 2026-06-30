# Event Ingest Pipeline

How in-game events get from the plugin into the portal's existing persistence/moderation pipeline — **without changing the downstream processors**.

```
plugin (OnFrame batched egress)
   │  HTTPS POST (shared app credential)
   ▼
APIM  ── auth + rate-limit + light validate ──►  Service Bus queues (managed identity, **direct**)
   ▼
portal-server-events processors (existing, unchanged for current event types): persist / moderate / GeoIP / live-stats
   ▼
portal-repository (SQL)
```

## Why not Service Bus directly

The plugin is outside Azure: no Service Bus SDK for 32-bit C/C++, no managed identity. So it speaks **HTTPS to APIM**, and APIM forwards to Service Bus using **managed identity** from a policy. The existing queue-triggered functions in `portal-server-events` are untouched — they still consume the same queues with the same envelope.

**APIM *is* the ingest — there is no function app or bespoke ingest service in front of Service Bus.** The APIM inbound policy authenticates the shared app, rate-limits, does **light** envelope validation, and posts **directly to the matching per-type queue** via managed identity. Deep validation (field checks, staleness, GameType parse) stays in the existing processors, exactly as today.

## Socket / HTTP facts (de-risking)

- The **4-socket limit (`PLUGIN_MAX_SOCKETS`) applies only to the raw TCP plugin API**. HTTP requests (`Plugin_HTTP_MakeHttpRequest`) heap-allocate their own sockets — **no concurrency cap**.
- **HTTPS is native** (mbedtls linked, CA store loaded) — `https://` URLs are transparently TLS.
- Non-blocking requests are pumped in `OnFrame` (`Plugin_HTTP_SendReceiveData` until done). **Never use the blocking variant on the main thread** — it freezes the server.

## Egress model: batched + buffered

Events are **audit-grade, not real-time** — at-least-once delivery with deduping is the contract.

- The plugin accumulates events in a **bounded buffer** (memory, optionally disk-backed) and flushes a **batch** per `OnFrame` cycle over one non-blocking HTTPS request.
- **Backpressure / drop policy:** when the buffer fills (portal slow/down), define priority — keep connects/bans, shed chat first. Cap memory deliberately.
- **Per-queue batching.** Since APIM posts **directly** into the per-event-type Service Bus queues (no app in between), the plugin groups buffered events by **target queue** and sends **one APIM call per non-empty queue** each flush — each call is a Service Bus batch send to that queue. This keeps the existing 8-queue model and processors unchanged. (HTTP isn't socket-capped, so a handful of per-queue calls per flush is fine.)
- **Batch contract.** Each call carries a JSON **array of same-type events** (each a full envelope); cap **~100 events / ~200 KB** per call (under the Service Bus 256 KB standard-tier message limit). APIM returns **202** on enqueue; any non-2xx → retain in the buffer and retry. The APIM policy maps each array element to a batched Service Bus message and sets `BrokerProperties.MessageId` from the envelope's GUID so duplicate detection keys on it.

## Resilience: offline portal & two buffering layers

There are **two** places events buffer, which matters for what "offline" means:

1. **Service Bus decouples the consumer.** If `portal-server-events` (the processors) is down but APIM + Service Bus are up, the plugin's POST still **succeeds** — the message sits on the queue and is processed when the consumer recovers. A processor outage never even reaches the plugin.
2. **The plugin's local buffer handles ingest/network outage.** Only if APIM / Service Bus / the network is unreachable does the plugin's POST fail — and then the plugin holds events in its **local bounded buffer** and retries.

Local-buffer behaviour when the ingest is unreachable:

- **Pre-allocated, bounded ring buffer.** Allocate the buffer **once** at init (respect the plugin's `PLUGIN_MAX_MALLOCS` = 50 limit — do *not* malloc per event; use a fixed ring). When full, apply the **drop policy**: keep high-value events (connects, captures), shed low-value (chat) first; drop-oldest beyond a max age.
- **Retry with exponential backoff + jitter** while offline, capped so a down portal doesn't spin the CPU or hammer the network.
- **Bounded loss is acceptable.** Events are audit-grade; under a *sustained* outage the oldest transient events (e.g. chat) may be dropped. Critical state self-heals by other means anyway — settings/active-bans re-sync on reconnect, the hourly `dumpbanlist` ban reconcile, and the 4-hourly demo/screenshot sweep — so nothing important is permanently lost.
- **Optional durability:** a disk-backed buffer (`Plugin_FS_SV_WriteFile`) survives a restart, at the cost of I/O. For audit-grade events, in-memory with bounded loss-on-crash is usually acceptable; treat disk-backing as an opt-in.

## Never block the main thread; never crash the server

The plugin runs **in-process** in a 32-bit native module — a hang stalls the game loop and an unhandled fault **crashes the server**. Hard rules:

- **Non-blocking only.** Use `Plugin_HTTP_MakeHttpRequest` + pump `Plugin_HTTP_SendReceiveData` in `OnFrame`. **Never** call the blocking `Plugin_HTTP_Request` on the main thread. Each `OnFrame` advances in-flight requests by a small, bounded amount and returns immediately — it never waits on the network.
- **Per-request timeouts/deadlines.** Abandon and `Plugin_HTTP_FreeObj` any request that exceeds a deadline, so a hung connection never pins a slot or buffer entry forever.
- **Treat errors as expected, not exceptional.** A failed/timed-out request (portal down) is a normal condition handled inline: log via `Plugin_Printf`, free the request, re-queue or drop per policy, and **continue**. Never abort the callback.
- **Defensive coding throughout.** Check every return (null request handle, send/recv status `-1`), bounds-check every buffer write, never deref a null/stale pointer. Free **every** `ftRequest_t`. No per-event leaks.
- **Don't let anything cross the ABI boundary.** If compiled with C++ exceptions, wrap the egress/`OnFrame` entry points in a catch-all so no exception unwinds across the C plugin ABI into the host (or compile `-fno-exceptions`). Reserve `Plugin_Error` (which disables the plugin / is fatal) for genuinely unrecoverable **init** failures — never for transient network errors.
- **Optional worker thread:** `Plugin_CreateNewThread` can own the HTTP entirely, with `Plugin_EnterCriticalSection` to hand off batches, so network latency is fully isolated from the game loop. This is more robust but adds threading risk (races/deadlocks, and a fault on any thread still crashes the shared process) — the `OnFrame` non-blocking pump is the simpler default and is sufficient.

The design intent: a slow or offline portal degrades to **buffer-and-retry with bounded loss**, and a network error or timeout is a logged, recovered event rather than a stalled frame. (Crash-safety from plugin *bugs* is a separate concern, handled by test discipline + staged rollout + auto-rollback — see [risks](risks-and-open-questions.md).)

## Envelope contract (reuse existing)

Reuse the existing `ServerEventBase` shape from `portal-server-events` so both the plugin and the legacy log-tail agent emit identical messages:

```
ServerEventBase {
  EventGeneratedUtc, EventPublishedUtc,
  ServerId, GameType, SequenceId
}
```

The 8 existing event types (player-connected/disconnected, chat-message, map-change, server-connected, server-status, ban-file-changed, player-ip-resolved) are the starting set. The plugin adds a few new ones:

- **`demo-captured`** — metadata only (captured `playerid`, server, map, filename, trigger source, timestamp). A new `portal-server-events` processor consumes it and **triggers portal-sync** to pull the file ([demos](demos.md)).
- **`screenshot-captured`** — same shape; triggers portal-sync to pull the file ([screenshots](screenshots.md)).
- **`player-killed`** (Phase 7) — kill/score telemetry (attacker, victim, weapon, means-of-death) for stats.

> **No new ban event.** Bans are deliberately **not** event-driven: portal→server enforcement is a cached **read** of active bans, and server→portal import is the poll-based hourly `dumpbanlist` reconcile ([bans](bans-portal-authority.md)). There is intentionally **no `server-ban-added` event** — don't re-add one.

> **`server-status` is periodic.** On plugin servers the plugin builds the live-roster snapshot in-process (slot iteration + `Plugin_GetClientScoreboard`) and emits it every ~60s, **replacing** the agent's RCON `status` poll. Legacy servers keep emitting it from the agent's RCON sync. Either source feeds the same `ServerStatusProcessor` that backs portal-web's live-players view and player-count graphs. The plugin also includes its **own version + a health/buffer indicator** in this snapshot, giving ongoing plugin-health visibility beyond the agent's load-time check.

- **`ServerId`/`GameType` are self-declared in the body** and trusted — the single shared app authenticates the request as "a game server", not a specific one, so the ingest cannot derive identity from the credential (see [authentication and trust](authentication-and-trust.md), accepted risk).
- **Dedupe via Service Bus duplicate detection** keyed on a **stable per-event `MessageId` (a GUID set when the event is created, unchanged across retries)** — this tolerates retries and plugin restarts without custom logic. `SequenceId` is informational ordering only; it resets on restart, so it is **not** the dedupe key. (Enabling duplicate detection is a **creation-time, immutable** queue property — see [risks](risks-and-open-questions.md).)

## Identity timing

Read stable identity at **`OnClientAuthorized`** (`Plugin_GetPlayerID` / `Plugin_GetPlayerSteamID`), not at raw `OnPlayerConnect`. The **IP is available at connect**, which removes the RCON `status` round-trip the agent currently performs and obsoletes the `player-ip-resolved` indirection for plugin servers.

## What changes / what doesn't

| Layer                | Change                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin               | New: batched egress, buffer, `OnFrame` pump.                                                                                                         |
| APIM                 | **New**: auth + rate-limit + light validation, then **direct** send to the per-type Service Bus queues via managed identity. No function/ingest app. |
| Service Bus          | Existing queues; **duplicate detection must be enabled** (creation-time, immutable property — see [risks](risks-and-open-questions.md)).             |
| portal-server-events | **Unchanged** for existing event types / migration scope; new event types (Phase 7) add new processors.                                              |
| Ingest dedupe        | Service Bus duplicate detection on a per-event `MessageId` GUID (`SequenceId` informational only).                                                   |

## Related

- [Authentication and trust](authentication-and-trust.md)
- [Architecture and data flow](architecture-and-data-flow.md)
- [Identity model](identity-model.md)

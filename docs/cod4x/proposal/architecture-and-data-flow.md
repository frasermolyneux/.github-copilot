# Architecture and Data Flow

How the pieces fit together end to end. See the [proposal index](README.md) for the document map and the [`../`](../README.md) reference docs for CoD4x server internals.

## Components and responsibilities

| Component                      | Role                                                                                                                                                                                                                                                               | Change scope                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **portal-cod4x-plugin**        | In-process CoD4x plugin (C++, x86, handler v4.000). Observes events, enforces bans and admin power, executes portal commands, captures artifacts, reads cached settings.                                                                                           | Build out from today's skeleton (startup broadcast only).                                                                                       |
| **portal-server-agent**        | Deploy/update/health-control the plugin; **keeps** the log-tail **and RCON `status` sync** for legacy/non-plugin game types and as the migration fallback.                                                                                                         | New lifecycle responsibilities; existing log-tail + status sync retained for legacy.                                                            |
| **APIM ingest front**          | Authenticated HTTPS front door for plugin egress → posts **directly** to the per-type Service Bus queues via managed identity (no function/ingest app). Light validation in policy; `ServerId`/`GameType` self-declared (see [auth](authentication-and-trust.md)). | **New.**                                                                                                                                        |
| **portal-server-events**       | Existing Service-Bus-triggered processors: persist, moderate, GeoIP-enrich, live stats. Plus a new processor that **triggers portal-sync** on artifact-capture events.                                                                                             | **Unchanged** for existing event types / migration scope; new event types (Phase 7: `player-killed`, `screenshot-captured`) add new processors. |
| **portal-sync**                | **Pulls** captured screenshots/demos off the server and **persists** them to portal-repository; runs both event-triggered and on a **4-hourly reconcile** sweep.                                                                                                   | New artifact-sync jobs.                                                                                                                         |
| **portal-servers-integration** | Already exposes a **generic per-server file API** (`IFilesApi`: `ListEntries` for any directory, `GetContent` for any file in binary mode with byte-range) over its cert-based FTP stack. portal-sync uses this to list and pull artifacts.                        | **No new surface** — reuses existing `IFilesApi`.                                                                                               |
| **portal-repository**          | Players, bans (`AdminActions`), demos, settings namespaces, admin-roster read endpoint, ban-import endpoint, screenshot storage.                                                                                                                                   | Additive schema + endpoints.                                                                                                                    |
| **portal-web**                 | Per-game-type command filtering, admin-power config UI, screenshot gallery.                                                                                                                                                                                        | UI additions.                                                                                                                                   |
| **portal-environments**        | Shared `portal-cod4x-plugin-dev`/`-prd` Entra app provisioning, APIM + Service Bus wiring.                                                                                                                                                                         | Terraform.                                                                                                                                      |

## The two control planes

The plugin operates on two distinct channels, deliberately separated:

1. **Data plane (plugin → portal):** asynchronous, batched, audit-grade events over **HTTPS** through APIM. At-least-once with ingest-side dedupe. Never blocks the game loop.
2. **Control plane (agent → server):** the `portal-server-agent` manages the plugin binary over its existing **FTP/SFTP + RCON** reach.

Artifact file retrieval (screenshots/demos) is a **third, separate flow** handled by `portal-sync` via `portal-servers-integration` — not by the plugin and not by the agent. Keeping these separate means the high-volume event path is decoupled from binary lifecycle and large-file transfer.

## End-to-end flows

### Player connect
1. `OnPlayerConnect` fires (slot, address — **IP available here**, PB guid, userinfo). The native IP-on-connect removes the RCON `status` round-trip the agent does today.
2. `OnClientAuthorized` resolves stable identity (`Plugin_GetPlayerID`, `Plugin_GetPlayerSteamID`).
3. Plugin looks up `playerid` in the cached **admin roster** → applies `cl->power` and notes the player's tags ([role mapping](portal-role-mapping-to-power.md)).
4. Plugin enqueues a `player-connected` event for batched egress ([event ingest](event-ingest-pipeline.md)).

### Chat message / command
1. `OnClientCommand` (chat — `say` / `sayteam`) fires in-process.
2. **Always** enqueue a `chat-message` event for egress — **every** chat line is persisted and moderated by `portal-server-events`, exactly as today. No line is dropped, including command invocations.
3. **Additionally**, if the line matches a portal command prefix, the plugin executes it **in-process** (authorizing against cached tags) and replies via `Plugin_ChatPrintf` or a portal HTTP call ([portal commands](chat-commands-portal.md)).
4. The **per-server source flag** is the single switch for command execution downstream: for plugin-sourced servers `ChatMessageProcessor` **persists/moderates but does not execute** commands (the plugin does); legacy servers execute as today. No per-message marker is added — the small double-execution risk from this coarser switch is **accepted**.

### Ban enforcement
1. On connect, `OnPlayerGetBanStatus` consults the plugin's **portal-sourced cached ban list**; a match drops the player. On a cache refresh, already-connected now-banned players are dropped from `OnFrame` ([bans](bans-portal-authority.md)).
2. A server-side native ban (`OnPlayerAddBan`) is **observe-only** — it is imported to the portal by the agent's hourly `dumpbanlist` reconcile. There is no ban event.

### Server status snapshot (live players + player-count graphs)
1. On plugin servers, the plugin builds a `server-status` snapshot **in-process** — connected roster (slot iteration, names, `playerid`/`steamid`), per-player score via `Plugin_GetClientScoreboard`, ping, plus map/title/mod/maxplayers — and emits it periodically (e.g. every ~60s) and/or on roster change.
2. This **replaces** the agent's RCON `status` poll for plugin servers (real-time, no RCON round-trip). On legacy servers the **agent** keeps polling RCON `status` and emitting `ServerStatusEvent` as today.
3. Either way the **same `server-status` queue → `ServerStatusProcessor` → cache** feeds portal-web's live-players view and player-count snapshot graphs — **unchanged downstream**.

### Screenshot / demo arrival
1. `OnScreenshotArrived` / `OnDemoArrived` fire for **any** trigger source, carrying the captured player.
2. The plugin emits a **capture event** (metadata only — no file transfer) via the normal ingest path.
3. A `portal-server-events` processor consumes it and **triggers `portal-sync`**.
4. `portal-sync` **pulls the file** off the server via `portal-servers-integration` and **persists** it to `portal-repository` (blob + DB record).
5. A `portal-sync` **4-hourly reconcile** sweep lists the server folders and pulls anything missed ([screenshots](screenshots.md), [demos](demos.md)).

## Why the plugin cannot publish to Service Bus directly

A game server is **outside Azure** and untrusted. There is no Service Bus SDK in 32-bit C/C++, and managed identity does not exist off-Azure. Therefore events travel **plugin → HTTPS → APIM → Service Bus → portal-server-events**. The CoD4x HTTP client links mbedtls, so HTTPS to APIM works natively, and the much-quoted 4-socket limit applies only to the **raw TCP** plugin API — HTTP requests allocate their own sockets with no concurrency cap (see [event ingest](event-ingest-pipeline.md)).

## Migration posture

Both event sources (plugin and log-tail) feed the **same** Service Bus queues with the **same** envelope, switched per-server by a "source" flag. Legacy CoD2/4/5 and any non-plugin server keep the log-tail path indefinitely. See [roadmap](roadmap-and-phasing.md).

## Out of scope

- **GSC scripting** (`../gsc-scripting.md`) — this integration uses the native C/C++ plugin; server-side GSC is not used.

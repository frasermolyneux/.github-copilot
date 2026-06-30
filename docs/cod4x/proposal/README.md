# CoD4x ↔ Portal Plugin Integration — Proposal

A design proposal for a **first-party CoD4x server plugin** (`portal-cod4x-plugin`) that replaces the current disjointed, external integration (FTP log-tailing, RCON polling, ban-file blobs) with an **in-process plugin** that publishes events, enforces portal-owned bans and admin power, runs portal commands in-game, ingests anti-cheat artifacts, and tolerates portal downtime.

> **Status:** Proposal / feasibility — nothing here is built yet. These documents capture the agreed design direction. Reference material on the CoD4x server itself lives one level up in [`../`](../README.md) (plugin system, admin system, RCON, anti-cheat data flow, player authentication).

## Why

Today the `portal-server-agent` (a separate repository) tails game-server logs over FTP/SFTP, regex-parses them, polls RCON for roster/IP/bans, and pushes 4 MB ban-file blobs across the fleet. This is fragile (log-format dependent), high-latency (0.5–5 min), offers no in-game interactivity, and ingests **no** anti-cheat artifacts. A native plugin runs *inside* the server process, so it sees events directly, can act in-game, and lets the portal become the source of truth for bans and admin power.

## The big picture

```
┌── Game server (Linux/Win, x86, OUTSIDE Azure) ──────────────────────────┐
│  cod4x18_dedrun ── loads ──► portal-cod4x-plugin (handler v4.000)        │
│   • Events: connect/auth/DC/kill/chat/map/screenshot/demo                │
│   • Bans: OnPlayerGetBanStatus authority + OnFrame proactive drop        │
│   • Admin power: set cl->power per connection from cached roster         │
│   • Commands: executes portal chatCommands in-process; tunes native cmds │
│   • Settings: periodic pull + local last-known-good cache (offline-safe) │
│   • Egress: batched, buffered, non-blocking HTTPS pumped in OnFrame      │
└───────────┬──────────────────────────────────┬──────────────────────────┘
            │ HTTPS (shared app credential)     │ FTP/SFTP + RCON
            ▼                                    │ (deploy/update/health)
   ┌────────────────────┐                       │
   │ APIM (ingest front)  │ ◄── NEW              ▼
   │ auth + validate     │            ┌────────────────────┐
   │ → Service Bus (MI)   │            │ portal-server-agent   │  role shift:
   └─────────┬───────────┘            │ lifecycle controller  │  no longer the
             │ Service Bus            └──────────┬───────────┘   event pump
             ▼                                   │ typed API clients
   ┌─────────────────────┐                       ▼
   │ portal-server-events │ (existing*)  ┌──────────────────────┐
   │ persist/moderate/    │              │ portal-repository API │
   │ GeoIP/live-stats     │──────────────│ + SQL + blob storage  │
   └─────────────────────┘              └──────────────────────┘
                                                   ▲
                                         ┌──────────────────────┐
                                         │ portal-web (admin UI) │
                                         └──────────────────────┘
```

_Not shown: the artifact flow — plugin `demo-captured` / `screenshot-captured` events → `portal-server-events` triggers **portal-sync**, which pulls files via **portal-servers-integration** and persists to `portal-repository` (see [demos](demos.md) / [screenshots](screenshots.md))._

## Document index

### Foundations
- [Architecture and data flow](architecture-and-data-flow.md) — components, repos, end-to-end flows, integration points.
- [Identity model](identity-model.md) — playerid / steamid, attribution, schema facts.
- [Authentication and trust](authentication-and-trust.md) — single shared app credential, APIM, self-declared `ServerId`.

### Core pipelines
- [Event ingest pipeline](event-ingest-pipeline.md) — plugin → APIM → Service Bus → processors.
- [Settings and offline cache](settings-and-offline-cache.md) — namespaces, sync, last-known-good behaviour.
- [Plugin installation and updates](plugin-installation-and-updates.md) — agent as lifecycle controller, staged rollout, rollback.

### Features
- [Bans — portal as authority](bans-portal-authority.md) — `OnPlayerGetBanStatus`, import, lift-only-from-portal.
- [Portal role mapping to power](portal-role-mapping-to-power.md) — `cod4xPower`, cached roster, admin power on connect.
- [Chat commands — portal-owned](chat-commands-portal.md) — `chatCommands`, two executors, compatibility filtering.
- [Chat commands — native server](chat-commands-native.md) — `cod4xCommands` desired-state power tuning.
- [Screenshots](screenshots.md) — capture choke point, portal-sync pull, greenfield storage.
- [Demos](demos.md) — capture, portal-sync pull, reuse of the existing demo pipeline.

### Delivery
- [Risks and open questions](risks-and-open-questions.md) — consolidated risk register and decisions still needed.
- [Roadmap and phasing](roadmap-and-phasing.md) — phase 0–7 with the migration fallback.

## Headline design decisions

| # | Decision |
|---|---|
| 1 | **Events go over HTTPS via APIM** (the plugin can't use the Service Bus SDK / managed identity from outside Azure). APIM posts **directly** into the **existing, unchanged** Service Bus queues via managed identity — **no function/ingest app** in between. |
| 2 | **Portal is the source of truth for bans.** The CoD4x native ban list is already delegated to plugins (`OnPlayerGetBanStatus`), so the plugin *is* the ban authority. |
| 3 | **Admin power via a cached roster** (`playerid → { power, tags }`), portal-link gated, keyed on **playerid** (no SteamID requirement). |
| 4 | **One command catalog, two executors.** Portal-owned commands live in `chatCommands`; the plugin is a second executor alongside `portal-server-events`. Native server commands are tuned via `cod4xCommands`. |
| 5 | **Single shared Entra app** for all servers (one Terraform block, like the existing static apps); the plugin authenticates to APIM with it and `ServerId` is **self-declared** in the body. **Accepted risk:** a leaked secret from any box can spoof any server's events fleet-wide; per-server containment deferred. |
| 6 | **Agent becomes the lifecycle controller** (deploy/update/health/rollback) and keeps the log-tail path for legacy + migration fallback. |
| 7 | **Artifacts:** the plugin emits capture events; `portal-server-events` triggers `portal-sync`, which pulls the files via `portal-servers-integration` and persists them to `portal-repository` (plus a 4-hourly reconcile sweep). Demos reuse the existing demo pipeline; screenshot storage is greenfield. |

\* `portal-server-events` is unchanged for the existing event types / migration scope; new event types (e.g. `player-killed`, `screenshot-captured`) in [phase 7](roadmap-and-phasing.md) add new processors.

See [Roadmap and phasing](roadmap-and-phasing.md) for sequencing.

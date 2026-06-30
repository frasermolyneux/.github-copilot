# Bans — Portal as Authority

**Goal:** the portal is the single source of truth for bans. Bans created on a server are imported to the portal; bans created in the portal are enforced on the server; bans can only be lifted from the portal.

## The key enabler

In the modern CoD4x server the **native ban list is commented out** — `SV_PlayerIsBanned()` delegates *every* connect-time ban decision to plugins via the `OnPlayerGetBanStatus` event. If a plugin writes the message buffer, the client is dropped; if no plugin objects, the player is admitted. (See [`../anticheat-data-flow.md`](../anticheat-data-flow.md) and [`../admin-system.md`](../admin-system.md) for the ban surface.)

This means the plugin can simply **be** the ban authority — it does not have to fight a native list. The shipped reference plugins `legacybanlist` and `sourcebansplugin` already implement exactly this pattern (cached external list + `OnPlayerGetBanStatus` gate + proactive drop), so `sourcebansplugin` is the working template.

## Enforcement (portal → server) — read path

The portal's **active bans** (`AdminActions` of type Ban/TempBan that haven't expired/been lifted) are the source of truth. The plugin **reads** them and enforces locally:

- **Read:** the plugin pulls the active ban list for its game type/server from the **portal-repository API** (via APIM, authenticated with the shared app — see [auth](authentication-and-trust.md)) on the same periodic [settings/cache](settings-and-offline-cache.md) cadence, into a local cache keyed on `playerid` (see [identity model](identity-model.md)). A new portal ban (created in portal-web) is enforced on the **next sync**.
- **At connect:** answer `OnPlayerGetBanStatus` authoritatively from the cache → banned players are dropped with the portal's reason.
- **Already-connected:** when the cache updates, proactively `Plugin_DropClient` any now-banned player from `OnFrame` (the `sourcebansplugin` loop).
- **Self-reconciling:** because the cache is **replaced** from the portal each sync, the portal→server direction needs no separate reconciliation — a ban added in the portal appears and is enforced; a ban lifted in the portal disappears and stops being enforced. The read sync *is* the reconcile.

> Needs one new portal **read endpoint**: "active bans for `(gameType / serverId)`" projecting `AdminActions`.

## Import & reconciliation (server → portal)

Reuse the **existing `CoD4xBanReconciliationService`** (today in the agent), **modified to import-only**, rather than building a bespoke per-event import + acknowledgement mechanism:

- **Hourly poll:** read the server's native ban list via RCON `dumpbanlist` (the established, proven source), diff against the portal's active bans, and **import any server-side ban the portal is missing** into `AdminActions`. Idempotent on `(playerid, gameType, ~created)`.
- **No duplication, by construction:** portal-originated bans are enforced by the plugin via `OnPlayerGetBanStatus` from its cache and **do not appear in the native `dumpbanlist`**, so they're never re-imported. The dump shows exactly the **server-originated** native bans (e.g. an in-game `tempban`) — which is precisely what needs importing.
- **Drop the "reapply portal-only bans" half** of the legacy reconciler: the plugin now enforces portal bans from its cache, so pushing them back over RCON would be redundant (and conflicting).
- **Latency:** a server-side ban reaches the portal within the poll interval (hourly). Acceptable — enforcement is unaffected (the local ban is active immediately; the portal already holds all portal-originated bans).
- **Self-healing:** a poll that fails is simply retried next interval; there is nothing to "lose", so no durable pending-set, no per-ban ack, no new event type.

**Where it runs:** keep it in the agent (it already has RCON and runs this hourly — the smallest, literal reuse), or later move it into the plugin as a periodic **ban-snapshot** push if we want to eliminate RCON for plugin servers entirely. The agent route is the recommended starting point.

> This replaces the earlier per-event `server-ban-added` + pending-import-set design. If near-real-time portal visibility of a server-side ban is ever wanted, a fire-and-forget event can be *added* on top — but it's not needed for correctness, because the hourly reconcile guarantees eventual import.

## Lift-only-from-portal

- `OnPlayerAddBan` / `OnPlayerRemoveBan` are **observe-only** (not vetoable; they fire after the fact).
- That is fine, because the **plugin's cache is authoritative at connect**: a local unban is re-asserted on the next sync/connect, so the player stays banned unless the ban is removed **in the portal**.
- Optionally **disable the native `permban`/`unban` commands** via [`cod4xCommands`](chat-commands-native.md) so the native front door is closed entirely and all ban mutation flows through the portal.

## Don't load the legacy ban plugin

The portal plugin is the **sole** ban authority. Do **not** also load `legacybanlist` — there is no native list to reconcile against, so there is one writer and no split-brain.

## Offline behaviour

- **Fail-safe.** During a portal outage the plugin keeps enforcing the **last-known active-bans cache** (never fail-open).
- Server-side bans created during an outage simply **remain on the server** and are picked up by the next hourly `dumpbanlist` reconcile once the portal returns — nothing is lost, because import is poll-based, not event-based.
- A **failed** active-bans sync keeps the previous cache; only an explicitly returned list replaces it (see [settings & cache](settings-and-offline-cache.md)).

## Related

- [Identity model](identity-model.md) — playerid keying.
- [Chat commands — native server](chat-commands-native.md) — disabling native ban commands.
- [Settings and offline cache](settings-and-offline-cache.md) — how the ban list is cached.
- [`../admin-system.md`](../admin-system.md), [`../anticheat-data-flow.md`](../anticheat-data-flow.md) — server-side reference.

# Settings and Offline Cache

How the plugin gets its configuration and keeps working when the portal is slow or offline.

## Principle: pull + last-known-good cache

The plugin pulls configuration periodically and writes a **last-known-good** local cache. All runtime behaviour reads from that cache, so portal downtime never stops the server. Resolution mirrors the agent today: **per-server override → global default → built-in default**.

**Delivery: pull model (decided).** The plugin **pulls** all configuration *and* the dynamic data (admin roster, active bans) periodically over HTTPS via APIM read endpoints, into the local last-known-good cache (ETag/hash to skip no-op refreshes). A pull model is required because the roster and active-bans are **dynamic** — they must refresh at runtime (to demote a revoked admin mid-session and enforce new bans), not only at deploy — and using one mechanism for everything keeps the offline cache consistent. The agent provisions the credential, the server's `ServerId`/`GameType`, and an optional first-run bootstrap; it does **not** push config on every change.

Default cadence (tunable): config + roster + active-bans sync **~60 s**.

## Namespaces the plugin reads

| Namespace                                      | Owner / status | What the plugin does with it                                                                                      |
| ---------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **chatCommands**                               | existing       | Commands it should **execute in-process** (see [portal commands](chat-commands-portal.md)).                       |
| **cod4xCommands**                              | new            | Native server command tuning to **reconcile onto the server** (see [native commands](chat-commands-native.md)).   |
| **cod4xPower**                                 | new            | Role-tag → power bands for the **connected-player roster** (see [role mapping](portal-role-mapping-to-power.md)). |
| **agent / broadcasts / banfiles / ftp / rcon** | existing       | Existing per-server config the agent uses today; relevant subsets move in-plugin over time.                       |

The connected-player **roster** (`playerid → { power, tags }`) is synced as part of this same periodic pull — compact, admins-only, scoped to the server's game type.

## Offline behaviour (the rules)

- **Fail to last-known-good.** A failed fetch must keep enforcing the previous cache — never strip admins, bans, or command config because a sync failed.
- **Distinguish "empty" from "failed."** Only an *explicitly empty* response clears state; a transport failure does not.
- **Re-apply on every successful sync** — not just startup. This is what keeps the server *accurate*: a portal-side revocation demotes a live admin, a removed ban stops being enforced, a retuned command power is re-asserted against local drift.
- **Bounded staleness is accepted** during an outage — the cache may be slightly old, but it is safe (fail-closed for bans and admin power).

## Drift reconciliation

For state the plugin pushes *onto* the server (native command powers — see [native commands](chat-commands-native.md)), re-assert on each refresh so a local admin retuning a command power is corrected back to the portal's desired state.

## Related

- [Event ingest pipeline](event-ingest-pipeline.md) — the egress counterpart.
- [Portal role mapping to power](portal-role-mapping-to-power.md) — the roster that rides this sync.
- [Roadmap and phasing](roadmap-and-phasing.md) — when each namespace lands.

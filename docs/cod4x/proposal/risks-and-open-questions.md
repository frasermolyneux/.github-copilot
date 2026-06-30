# Risks and Open Questions

Consolidated risk register and the decisions still to be made. See per-domain docs for detail.

## Risk register

| Risk | Severity | Mitigation | Detail |
|---|---|---|---|
| A plugin bug **crashes the live game server** (32-bit, in-process) | **High** | Extreme test discipline; canary→ring→fleet; auto-rollback; never block the main thread; fuzz parsers/handlers | [Plugin install](plugin-installation-and-updates.md) |
| **Shared ingest secret** on untrusted hosts (no per-server identity; `ServerId` self-declared) | **High — accepted** | A leak from any box can spoof **any** `ServerId` fleet-wide; revocation is all-or-nothing. Mitigate with rate-limiting + strict envelope validation + anomaly watching. Per-server-key containment documented but **deferred**. | [Auth & trust](authentication-and-trust.md) |
| **Hot-reload assumed working** (`unloadplugin`/`loadplugin` live) | Low (assumption) | Designed around hot-reload working; staged rollout + auto-rollback contain a bad build. If it proves unreliable, fall back to update-on-restart (localised change). | [Plugin install](plugin-installation-and-updates.md) |
| **Event double-counting** during dual-run (plugin + log-tail) | Medium | Per-server source flag; ingest idempotency keys | [Event ingest](event-ingest-pipeline.md), [Roadmap](roadmap-and-phasing.md) |
| New **internet-facing ingest** = attack surface | Medium | APIM + auth + strict validation + rate limiting; treat all fields hostile; OWASP review | [Auth & trust](authentication-and-trust.md) |
| Plugin resource limits (4 TCP sockets, 50 mallocs, 32-bit memory) | Medium | HTTP is *not* socket-capped; batch egress; bounded buffer; careful allocation | [Event ingest](event-ingest-pipeline.md) |
| **Non-Steam admins** can't use the native admin store | Low (mitigated) | Plugin-owned power keyed on `playerid`; native store avoided | [Role mapping](portal-role-mapping-to-power.md) |
| **Scope creep** (rewriting agent, events, settings, web at once) | Medium | Strict phasing; keep log-tail fallback | [Roadmap](roadmap-and-phasing.md) |
| **Stale cache** during portal outage | Low | Fail-safe (keep enforcing last-known); re-apply each sync; distinguish empty vs failed | [Settings & cache](settings-and-offline-cache.md) |

## Decided

- **Ingest auth** — single shared Entra app per environment (`portal-cod4x-plugin-dev`/`-prd`), `ServerId` self-declared, fleet-wide blast-radius risk **accepted**; per-server key deferred. ([auth](authentication-and-trust.md))
- **Hot-reload** — **assumed working**; design around live `unloadplugin`/`loadplugin`, fall back to update-on-restart only if it proves unreliable. ([plugin install](plugin-installation-and-updates.md))
- **Admin power / non-Steam** — plugin-owned transient power keyed on `playerid` (cached roster, Option B); no native admin store, no SteamID requirement, no schema change. ([role mapping](portal-role-mapping-to-power.md))
- **Bans** — portal source of truth; enforcement = cached read of active bans; import = reuse `CoD4xBanReconciliationService` modified to **import-only** (hourly `dumpbanlist` diff). No new ban event. ([bans](bans-portal-authority.md))
- **Chat** — every line forwarded for persistence/moderation; command execution in-process; per-server source flag gates downstream execution; double-execution risk accepted (no per-message marker). ([portal commands](chat-commands-portal.md))
- **Artifacts** — plugin emits capture events; `portal-server-events` triggers `portal-sync`, which pulls files via `portal-servers-integration`'s existing `IFilesApi` (no new file API) + 4-hourly reconcile. Linked to `Player` via `playerid`; demo `UserProfileId` defaults to the static Admin profile. ([demos](demos.md), [screenshots](screenshots.md))
- **server-status** — plugin-sourced in-process for plugin servers (replaces RCON `status` poll); agent retains it for legacy. ([event ingest](event-ingest-pipeline.md))
- **Ingest topology** — **APIM posts directly into the Service Bus queues** via managed identity; **no function app or bespoke ingest service**. Light validation (auth, rate-limit, envelope shape) in APIM policy; deep validation stays in the existing processors. ([event ingest](event-ingest-pipeline.md))
- **Settings delivery** — **pull model**: the plugin pulls config + admin roster + active bans periodically via APIM read endpoints into the offline cache (dynamic data must refresh at runtime, not deploy). Agent provisions credential + `ServerId`/`GameType` + optional bootstrap. ([settings](settings-and-offline-cache.md))
- **Per-queue batch contract** — JSON array of same-type events per call, ~100 events / ~200 KB cap, 202 on enqueue, retain-and-retry on non-2xx; dedupe via **Service Bus duplicate detection on a stable per-event `MessageId` GUID** (`SequenceId` is informational only). ([event ingest](event-ingest-pipeline.md))
- **Ban reconcile location** — runs in the **agent** (reuse `CoD4xBanReconciliationService`, import-only); optionally moved to a plugin snapshot later. ([bans](bans-portal-authority.md))
- **Plugin self-identity** — the plugin's `ServerId` + `GameType` are **injected at install** by the agent (cvars / bootstrap), not discovered at runtime. ([auth](authentication-and-trust.md))
- **Plugin health** — plugin **version + health/buffer indicator** piggyback on the periodic `server-status` snapshot (ongoing health beyond the agent's load-time check). ([event ingest](event-ingest-pipeline.md))
- **Tuning defaults** — accepted starting points (config/roster/active-bans sync ~60 s, server-status ~60 s, ban reconcile hourly, artifact sweep 4 h, egress flush ~1–5 s, retry 1 s→exp→60 s + jitter, buffer ~a few k events / ~1–2 MB); refined during build.

## Still open

No open **design** decisions remain — these are confirmations / implementation-time refinements:

- **Service Bus duplicate detection** — confirm whether the existing queues have `RequiresDuplicateDetection` enabled (a creation-time, immutable property; enabling it later means recreating the queue) and set a dedup window covering the retry/restart horizon. ([event ingest](event-ingest-pipeline.md))
- **APIM tier / capacity** — confirm the consumption-tier APIM comfortably fronts an internet-facing, rate-limited ingest for ~80 servers (capacity + cost); consider tier implications.
- **Final tuning values** — confirm the default cadences / buffer / backoff against real fleet load during the canary phase.
- **Schema/version evolution** — how new event types and settings `schemaVersion` bumps roll out to a mixed-version plugin fleet (additive, backward-compatible by default).

## Related

- [Roadmap and phasing](roadmap-and-phasing.md)
- [Architecture and data flow](architecture-and-data-flow.md)

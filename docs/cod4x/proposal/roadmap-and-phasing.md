# Roadmap and Phasing

Delivery sequence. The guiding principle: **keep the existing log-tail path alive** throughout, switch servers over one at a time, and never flip the whole fleet at once.

## Phases

### Phase 0 — Decisions & contracts
Lock the [ingest auth model](authentication-and-trust.md), the [envelope contract](event-ingest-pipeline.md), the new settings namespaces (`cod4xPower`, `cod4xCommands`) and the `chatCommands` compatibility attributes, and the per-server **source flag**. Confirm the decided ingest topology (APIM → Service Bus direct, no ingest app).
*Contract/NuGet-first: surface any `Settings.Contracts.V1` additions early and phase the work (contract first, then consumers).*

### Phase 1 — Ingest backbone
Build the [APIM-fronted ingest API](event-ingest-pipeline.md) (auth → validate → forward to the **existing** Service Bus queues). Prove end-to-end with a test harness emitting the existing event types. **`portal-server-events` is untouched.**

### Phase 2 — Read-only plugin (shadow mode)
On a **canary** server, the plugin emits connect/DC/chat/map events over HTTPS **alongside** the still-running log tail. Compare plugin-sourced vs agent-sourced events for parity. Validate the `OnFrame` HTTP pump, bounded buffer, and local settings cache. No writes, no admin, no bans yet.

### Phase 3 — Cut over events per server
Add the per-server **source flag**; switch canary → ring → fleet from log-tail to plugin events. The agent stops parsing for plugin-enabled servers but keeps the path for non-plugin game types.

### Phase 4 — Agent as lifecycle controller
The [agent](plugin-installation-and-updates.md) owns upload / `loadplugin` / version-pin / health / rollback with staged rollout. Define the health-report-back channel.

### Phase 5 — Settings & in-game commands
Plugin reads [`chatCommands`](chat-commands-portal.md) and executes them in-process; broadcasts move from RCON `ConSay` to `Plugin_ChatPrintf`; `!report` / welcome messages run in-process. Native command tuning via [`cod4xCommands`](chat-commands-native.md) goes live.

### Phase 6 — Admin power
[Cached roster (Option B)](portal-role-mapping-to-power.md): project portal roles → power; apply on connect; re-apply each sync (live demotion); enforce from cache when offline.

### Phase 7 — New capabilities
[Bans as portal authority](bans-portal-authority.md) (if not already enabled); [screenshot](screenshots.md) + [demo](demos.md) ingest — plugin capture events trigger `portal-sync`, which pulls files via `portal-servers-integration` and persists them to `portal-repository`, backed by a **4-hourly reconcile** sweep; and kill/score stats via `OnPlayerKilled` + `Plugin_GetClientScoreboard`.

> Bans can be brought forward (the native delegation makes them low-friction); sequence them whenever the cached-list plumbing from Phase 2/3 is ready.

## Throughout

- Keep the **log-tail path** for non-plugin game types and as the migration fallback; retire it only at full fleet cutover.
- Maintain envelope parity between plugin and log-tail sources so the per-server source flag is a clean switch.

## Dependency sketch

```
Phase 0 (contracts) ─► Phase 1 (ingest) ─► Phase 2 (shadow) ─► Phase 3 (cutover)
                                                                   │
                                                                   ▼
                                              Phase 4 (lifecycle) ─► Phase 5 (settings/commands)
                                                                          │
                                                                          ▼
                                                          Phase 6 (admin power) ─► Phase 7 (bans/artifacts/stats)
```

## Related

- [Risks and open questions](risks-and-open-questions.md)
- [Architecture and data flow](architecture-and-data-flow.md)
- [Proposal index](README.md)

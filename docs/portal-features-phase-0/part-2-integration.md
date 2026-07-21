# Part 2 — Integrate the SDK into the Consuming Hosts

Wire the five hosts to the SDK contracts, registering **today's** logic as in-host contributors/handlers/jobs. **Behaviour must not change.** Nothing moves into a feature repo yet. Every host is proven by **characterization (golden-master)** tests and, for `portal-web`, **Playwright** snapshots.

> Prerequisite: the [Part 1 publish gate](part-1-sdk.md#18--publish-gate-hard-stop) has passed — the SDK packages restore from NuGet.org. Do not bridge with project references.

Host scope (decision 5): `portal-web`, `portal-server-events`, `portal-repository-func`, `portal-sync`, `portal-repository`. `portal-servers-integration` and `portal-server-agent` are **untouched**.

---

## 2.0 — Prerequisites (do first, in order)

1. **Baseline the safety net BEFORE any refactor.**
   - `portal-web`: capture Playwright snapshots of navigation, a player profile, the dashboard, and each settings page.
   - `portal-server-events`: build the characterization harness — record representative Service Bus messages per queue and snapshot the resulting Repository API calls, RCON calls, and audit events from the **current** processors. Use a **recording `IRepositoryApiClient`** (or `portal-repository`'s `Api.Client.Testing` fakes), the SDK `FakeRconGateway`, and `FakeAuditLogger` to capture the calls; author the per-queue message **fixtures by hand** from real message shapes (`Server.Events.Abstractions.V1` DTOs).
   - timer hosts: snapshot each job's Repository writes on a fixture.
   These baselines are the pass/fail oracle for the rest of Part 2.
2. **Add SDK package references** (`XtremeIdiots.Portal.FeatureSdk`, and `FeatureSdk.Web` for `portal-web`; `.Testing` in test projects) at the published `0.1.x`.
3. **Wire `Microsoft.FeatureManagement`** in the hosts that lack the *service*. Only `portal-server-events` currently calls `AddFeatureManagement()`. **`portal-web` has the `FeatureManagement:*` App Config selector but does NOT call `AddFeatureManagement()`** — add it there too (the `features.IsEnabled(...)` calls in Phase 1 depend on it). Also add `AddFeatureManagement()` (+ the `FeatureManagement:*` selector) to `portal-repository-func` and `portal-sync`. **No feature flag is switched on in Phase 0** — this is Phase 1 readiness only. Also add a **startup flag-read helper**: because feature registration runs **before** the DI container is built, evaluate flags synchronously from `builder.Configuration["FeatureManagement:<name>"]` (the feature name is the bare key, e.g. `Maps.V2`), **not** via the async `IFeatureManager`. Every `features.IsEnabled("<name>")` in later phases means this startup read.
4. **Dependency asserts.** `AddPortalFeatureCore()` asserts only the **always-required** trio (`IRepositoryApiClient`, `IMemoryCache`, `IAuditLogger` via `AddObservability()`). The **event/web hosts also call `AddPortalFeatureRcon()`**, which asserts `IServersApiClient`; **the timer hosts call only `AddPortalFeatureCore()`** and need not register `IServersApiClient` (they never resolve `IRconGateway`). **Feature-specific** dependencies (e.g. a moderation feature's `ContentSafetyClient`) are **not** host prerequisites — the feature registers them from host-supplied config via its options builder.

**Acceptance:** baselines captured; SDK restores in every host; hosts still build/test/format green with the SDK referenced but not yet used.

---

## 2.A — `portal-web` (composability refactor, decision 3)

Refactor shared Razor to render from SDK contributors, registering **existing** items as in-host contributors. Do this **incrementally**, validating snapshots after each sub-step.

1. **Bootstrap:** `AddPortalFeatureCore()` + `AddPortalFeatureRcon()` + `AddPortalFeatureWeb()` in `Program.cs`. Enable `AddFeatureControllers` plumbing (ApplicationParts) even though no external controllers exist yet.
2. **Navigation:** refactor `Views/Shared/_Navigation.cshtml` to render the `INavigationModelBuilder` output. Create in-host `INavigationContributor`(s) that reproduce the **current** tree exactly — Home, Dashboard, the Servers group (Game Servers, Player Map, Maps), Players, Admin Actions, Chat Log, Tags, Demos, Users, Global Settings, etc. — preserving order, `fa-*` icons, `policy=` gating, and every `data-testid`. **Validate nav snapshot.**
3. **Player profile:** refactor the profile page to loop ordered `IPlayerProfileBlock`s. Wrap the existing `AdminActionsViewComponent`, `GameServerListViewComponent`, and `PlayerTagsViewComponent` as in-host blocks with their current policies and order. **Validate profile snapshot.**
4. **Dashboard:** wrap existing dashboard tiles as `IDashboardWidget`s (including the map-popularity tile — it becomes the Maps widget in Phase 1; for now keep it in-host). **Validate dashboard snapshot.**
5. **Settings pages:** refactor to loop `ISettingsSection`s; register the current global and game-server namespaces as in-host sections backed by the existing `GlobalSettingsService` / `GameServerSettingsService`. As features migrate, each section becomes a thin **shell** whose contract + validator come from the feature's `.Abstractions` NuGet: reads go through the SDK `IFeatureSettingsResolver`, and **writes validate semantically with the feature's `IFeatureSettingsValidator<T>`** (the writer is where semantic validation lives now — the repository is structural-only per 2.D). **Validate settings snapshots.**
6. **Permissions:** replace the body of `AddXtremeIdiotsPolicies()` with a loop over `IPermissionCatalog` (aggregated from **one** in-host `IPermissionContributor` returning today's `AdditionalPermission.Definitions`). Keep every policy→requirement→handler mapping and register the existing handlers unchanged. Assert the composed policy set equals today's.
7. **Client/config hygiene:** do not change how API clients or App Config are wired; the SDK consumes the host-registered clients.

**Acceptance (2.A):** every Playwright snapshot matches the baseline; `dotnet build` (Release, warnings-as-errors, Razor precompile) + `dotnet test` + `dotnet format --verify-no-changes` green; the composed policy set is unchanged.

---

## 2.B — `portal-server-events` (FULL pipeline decomposition, decision 1)

Convert **every** queue processor into the ordered `IServerEventHandler<T>` pipeline. For each queue: (a) add/keep the host `[ServiceBusTrigger]` stub that **maps** the `Server.Events.Abstractions.V1` wire DTO → the SDK event record (decision 2) and calls `IServerEventPipeline.RunAsync`; (b) extract the processor's inline steps into in-host handler classes, assigning each an `Order` that **reproduces the processor's actual current sequence** (the bands are **advisory labels** — where the real order differs from the band, the real order wins; derive every `Order` from the characterization baseline); (c) register them; (d) mark persistence handlers as **platform/core** (host-owned). Preserve today's error semantics — **let exceptions propagate** so messages dead-letter exactly as now.

1. **Bootstrap:** `AddPortalFeatureCore()` + `AddPortalFeatureRcon()` (the events host uses RCON). Refactor the existing `Commands/*` framework so each command (`CommandsCommand`, `MapVoteLike/Dislike`, `Register`, `WhoAmI`, `Fu`) implements the **SDK `IChatCommand`**; keep the parser/catalog/authorization/safety/idempotency/rate-limit framework in-host (it becomes the Chat Commands feature in Phase 3). This is what lets Maps' map-vote commands move to a package in Phase 1.

2. **Decompose per queue** (bands: 0–99 core, 100–199 enrichment, 200–299 reaction):

| Queue → SDK event                                | In-host handlers (band) — preserve exact behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChatMessage` → `ChatMessageEvent`               | `PersistChatMessageHandler` (core 50) · `ChatCommandDispatchHandler` (reaction 250, wraps the command framework; **preserves the `Cod4xPluginCommandExecutionPolicy` skip**) · `ChatModerationHandler` (reaction 260 — **observation only**; keeps the `EventIngest.ChatToxicityDetection` flag + the new-player/`ModerateChatTag` cost gate; records an `Observation`, **no effect on the command**)                                                                                                                                                                               |
| `PlayerConnected` → `PlayerConnectedEvent`       | **`PlayerConnectedHandler` (core, single orchestration)** — reproduces `PlayerConnectedProcessor` **exactly**: create/update player + record session + persist IP, then call the in-host collaborators **`IProtectedNameEnforcer`** (CoD4x) → **`IConnectionEnricher`** (GeoIP) → **`IConnectionGuard`** (VPN-detected tag + VPN kick) → **`IConnectionGreeter`** *only if* the guard was not destructive. **Do not split into independent handlers** (decision 17) — the welcome-suppressed-when-VPN-kicks control flow and the shared IP-intelligence require the single handler. |
| `PlayerDisconnected` → `PlayerDisconnectedEvent` | `PersistPlayerDisconnectedHandler` (core 50)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `MapChange` → `MapChangeEvent`                   | `PersistMapChangeHandler` (core 50) — *(Maps reaction added in Phase 1)*                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `ServerConnected` → `ServerConnectedEvent`       | `PersistServerConnectedHandler` (core 50) — persists the `OnServerConnected` game-server event — **and** `ServerOnlineAnnounceHandler` (reaction 250): `ServerConnectedProcessor` sends an on-connect RCON `Say` ("Server Events is now online (version …)", agent-name-prefixed) via `IRconResponseService` → `IRconGateway`. Preserve **both**.                                                                                                                                                                                                                                   |
| `ServerStatus` → `ServerStatusEvent`             | **`ServerStatusHandler` (core)** — a **single** platform handler that keeps the existing per-player loop: resolve player id + GeoIP intelligence **to build** each live-player record, then write live status / stats / recent players. Enrichment **feeds** the write, so do **not** split it into write-before-enrich bands.                                                                                                                                                                                                                                                      |
| `BanApplied` → `BanAppliedEvent`                 | `PersistBanAppliedHandler` (core 50)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `BanFileChanged` → `BanFileChangedEvent`         | `BanFileChangedHandler` (core 50)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `BanLiftApplied` → `BanLiftAppliedEvent`         | `PersistBanLiftHandler` (core 50)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `BanSyncFailed` → `BanSyncFailedEvent`           | `BanSyncFailedHandler` (core 50)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `PlayerIpResolved` → `PlayerIpResolvedEvent`     | **`PlayerIpResolvedHandler` (core, single orchestration)** — reproduces `PlayerIpResolvedProcessor`: persist IP, then **`IConnectionEnricher`** (GeoIP) → **`IConnectionGuard`** (VPN-detected tag + VPN). No protected-name, no greeter.                                                                                                                                                                                                                                                                                                                                           |

   - Handlers consume `IServerEventContext` + inject `IRconGateway` / `IFeatureCache` / `IAuditLogger` / clients — **remove local per-game RCON `switch`es** (use `IRconGateway`; the switch lives in the SDK gateway, lifted from `RconResponseService` / `MapVoteCommandBase`).
   - **VPN runs on BOTH `PlayerConnected` and `PlayerIpResolved`** today (both call `vpnProtectionService.ProcessAsync` + `vpnDetectedTagService.AddIfDetectedAsync`), so **both** core orchestration handlers call `IConnectionGuard`. The standalone `VpnProtectionEvaluation` function is subsumed by the guard; keep behaviour identical. `IpAddressGuard` is **shared** (used for IP persistence on both events), so it **stays in the host** — do not move it into a feature.
   - `AutoReplayDeadLetterQueues` / `ReprocessDeadLetterQueue` are infrastructure — leave as-is.
3. **Ordering check:** the current inline order for chat is **persist → command dispatch → moderation**. Moderation is a passive `Observation` writer that runs **after** commands and has **no effect on them**. Assign `Order`s to reproduce that exactly (command 250 before moderation 260). The pipeline runs every handler in order — there is **no short-circuit primitive**, so do not build one.

**Acceptance (2.B):** the characterization harness shows, per queue, **identical** Repository API calls, RCON calls (via `FakeRconGateway`), and audit events versus baseline; ordering preserved; **the connect/ip-resolved orchestration coupling is preserved** (welcome suppressed when the guard is destructive; shared IP intelligence; both events run as a single core orchestration handler, not split); messages still dead-letter on failure. Build/test/format green.

---

## 2.C — Timer hosts (`portal-repository-func`, `portal-sync`)

1. **Bootstrap:** `AddPortalFeatureCore()` + the `Microsoft.FeatureManagement` wiring from 2.0.
2. **Register existing jobs**, keeping each `[TimerTrigger]` (and paired manual `[HttpTrigger]`) as a **thin host stub** that calls `IJobRunner.RunAsync("JobName")`. Register plain jobs via `AddScheduledJob<>()` and reconcilers via `AddReconciliationJob<>()`:
   - `portal-repository-func`: the four `DataMaintenance` prunes, `MapPopularity`, `UnclaimedActionReminder` (`AddScheduledJob`); and the **three** `Set="PlayerTags"` reconcilers via `AddReconciliationJob` — `ResetSystemAssignedPlayerTags` (`Phase=Reset`, **platform-owned**; clears system tags and must precede the rest), `ReconcileConnectedPlayerTags` (`Phase=Reconcile`), and `ReconcileVpnDetectedTags` (`Phase=Reconcile`, later `Order`). Each keeps its **own** `[TimerTrigger]` calling `RunAsync("Name")`, preserving today's **03:00 → 03:30 → 04:00** cron spacing for parity (not yet consolidated under one `RunSetAsync` trigger). All stay in-host in Phase 0; ownership splits later (connected → Player Tags, VPN-detected → AutoAdmin).
   - `portal-sync`: `UserProfileForumsSync` (platform reconciliation — stays here), `BanFileMonitor`, `MapImageSync`, `MapRedirectSync`, `RedirectToGameServerMapSync`, `MapRotationCleanup`, `ConnectedPlayerTagReconciliationSync` (`Set="PlayerTags"`, via `AddReconciliationJob`).
3. Wrap job execution in `IJobTelemetry` via the runner (as today's jobs already do).

**Acceptance (2.C):** each job produces identical Repository writes vs baseline; reset→reconcile order preserved; jobs remain idempotent (run twice = same result); schedules unchanged. Build/test/format green.

---

## 2.D — `portal-repository` (structural permission **and settings** validation)

**Do (permissions):** Add an **additive** structural validator to the claim create/set path: claim type matches `{Domain}.{Action}` (non-empty segments) and claim value is a valid `GameType` (not `Unknown`) **or** a GUID. Keep the **existing catalogue validation in parallel** (structural is more lenient). **Do not** reference the SDK or any feature package — copy the ~10-line rule (the SDK's `StructuralPermissionValidator` is the reference implementation to mirror).

**Do (settings):** Reduce the settings create/set path to **structural-only** validation — a **non-empty namespace** and **well-formed JSON** (mirror the SDK's `StructuralSettingsValidator`; copy the rule, no SDK reference). The data plane must **not** know any feature's settings schema; **semantic** validation moves to the writer (`portal-web`, 2.A). For **platform** namespaces (e.g. `serverlist`) keep the existing typed validation via the platform `Settings.Contracts.V1` package. This is the decision-12/13 border: repository = structural + platform-typed; features = semantic-at-writer.

**Acceptance (2.D):** existing permission + settings writes still succeed; malformed writes still rejected (bad JSON / empty namespace); platform-namespace typed validation unchanged; **no feature package reference** in `portal-repository`; existing repository tests green; build/test/format green.

---

## 2.E — Cross-cutting validation & exit gate

**Do:**
- Re-run the full characterization harness and all Playwright snapshots across the touched hosts.
- Confirm no feature code has moved to a feature repo; no feature flag is switched on.
- Confirm `portal-servers-integration` and `portal-server-agent` are unchanged.

### ✅ Phase 0 exit gate
- [ ] All five hosts build/test/format green.
- [ ] `portal-web`: nav/profile/dashboard/settings render from contributors; Playwright parity; policy set unchanged.
- [ ] `portal-server-events`: every queue runs through the SDK pipeline; characterization parity; ordering + **connection-orchestration coupling** + dead-letter behaviour preserved (connect/ip-resolved run as single core orchestration handlers, not split).
- [ ] Timer hosts: jobs run via the runner; parity + idempotency + reconciliation order preserved.
- [ ] `portal-repository`: additive structural permission **and settings** validation; platform-namespace typed validation unchanged; no feature/SDK reference.
- [ ] `Microsoft.FeatureManagement` wired in all hosts; **no flag switched**.
- [ ] SDK `0.1.x` consumed everywhere; behaviour identical to pre-Phase-0.
- [ ] `code-review` sub-agent run per repo; High/Medium findings resolved.

**On exit**, the estate behaves exactly as before but runs on the SDK seams — ready for Phase 1 (Maps) to move code into `portal-feature-maps` behind `Feature.Maps.V2`. The SDK core stays at `0.x` until the Maps pilot freezes it at `v1.0`.

---

## Per-host validation commands

```pwsh
# portal-web
dotnet build src/XtremeIdiots.Portal.Web/XtremeIdiots.Portal.Web.csproj
dotnet test  src --filter "FullyQualifiedName!~IntegrationTests"
dotnet format src/XtremeIdiots.Portal.Web.sln --verify-no-changes

# portal-server-events
dotnet build src/XtremeIdiots.Portal.Server.Events.slnx
dotnet test  src/XtremeIdiots.Portal.Server.Events.slnx --filter "FullyQualifiedName!~IntegrationTests"
dotnet format src/XtremeIdiots.Portal.Server.Events.slnx --verify-no-changes

# portal-repository-func / portal-sync / portal-repository — build, test, format the repo solution as per each AGENTS.md
```

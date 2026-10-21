# Phase 3 · Part 1 — Build & Publish `portal-feature-autoadmin`

Create the AutoAdmin feature repo and its three packages, moving the VPN Protection, Chat Moderation, and Protected Names code out of `portal-server-events` and `portal-web`. Ends at a **hard publish gate** — [Part 2](part-2-host-integration.md) does not start until the packages restore from NuGet.org.

> Footprint, decisions, and the settings-contract nuance: [README.md](README.md). Prerequisite: the latest **pre-freeze** SDK (`0.x`) published and consumed, plus the tag substrate from [§0](#0--sdk-prerequisite-build-the-tag-substrate-pre-freeze-nuget-gate) (the `v1.0` freeze is Phase 4).

> **SDK prerequisite (do first \u2014 NuGet dependency gate):** AutoAdmin reads/writes player tags from a package, so the SDK needs the **tag substrate** (`IPlayerTagService`, `ITagDefinitionContributor`; `AddReconciliationJob<>()` already ships from Phase 0). It is a **pre-freeze SDK addition** (the freeze is Phase 4) \u2014 build it in `portal-feature-sdk`, publish, and consume that version here. **Full mini-spec: [\u00a70 below](#0--sdk-prerequisite-build-the-tag-substrate-pre-freeze-nuget-gate).** Surface it as the phase's package-first gate **before** building `.Processing`.

---

## 0 — SDK prerequisite: build the tag substrate (pre-freeze, NuGet gate)

AutoAdmin reads/writes player tags from a **package**, so add this to `portal-feature-sdk`, publish, and consume that version here. It is a **pre-freeze** SDK change (the `v1.0` freeze is Phase 4).

### Contracts (add to `FeatureSdk`, `Tags/`)
```csharp
public sealed record PlayerTag(string Type, string? Value, bool SystemAssigned);

public interface IPlayerTagService
{
    Task<IReadOnlyCollection<PlayerTag>> GetAsync(Guid playerId, CancellationToken ct);
    Task<bool> HasAsync(Guid playerId, string tagType, CancellationToken ct);            // e.g. "ModerateChat"
    Task AddSystemTagAsync(Guid playerId, string tagType, string? value, CancellationToken ct);  // SystemAssigned = true
    Task RemoveSystemTagAsync(Guid playerId, string tagType, CancellationToken ct);
}

// Features contribute their SYSTEM tag definitions (mirrors IPermissionContributor) \u2014 a catalogue for UI/validation.
public sealed record TagDefinition(string Type, string DisplayName, string Description);
public interface ITagDefinitionContributor { IEnumerable<TagDefinition> GetTagDefinitions(); }
public interface ITagCatalog { IReadOnlyCollection<TagDefinition> All { get; } bool IsKnown(string type); }
```

### Infrastructure + registration (in `FeatureSdk`)
- **`PlayerTagService : IPlayerTagService`** \u2014 wraps the Repository **player-tag API** (`IRepositoryApiClient`); **every write sets `SystemAssigned = true`**; reads are cached through `IFeatureCache` (short TTL, key `tags:{playerId}`) and invalidated on write.
- **`TagCatalog : ITagCatalog`** \u2014 aggregates registered `ITagDefinitionContributor`s; **throws on duplicate tag type**.
- **`AddPlayerTagSubstrate(this IServiceCollection s)`** \u2014 registers `IPlayerTagService` + `ITagCatalog`; **asserts `IRepositoryApiClient`** (fail-fast). Hosts that read/write tags call it (see below).
- **`AddTagDefinitionContributor<T>()`** \u2014 registers a contributor.
- `AddReconciliationJob<T>()` already exists (Phase 0, decision 3) \u2014 used to register the tag reconcilers.

### Reset semantics (parity-safe during partial migration)
The platform **`ResetSystemAssignedPlayerTags`** stays as today: it clears tags where **`SystemAssigned = true`** (the existing flag), then the reconcilers re-derive. Because **every** `IPlayerTagService` write marks the tag system-assigned, the reset naturally clears package-written tags (AutoAdmin's VPN-detected) **without** needing to know each feature's specific definition \u2014 so the reset-before-reconcile invariant holds even while the `PlayerTags` set is **split** across in-host (reset + connected reconcile, still Player-Tags-owned in Phase 3) and package (AutoAdmin's VPN-detected reconcile). `ITagDefinitionContributor` is the **catalogue** (UI/validation, mirroring permissions); it is **not** required by the reset for correctness.

### Which hosts register the substrate
- **`portal-repository-func`** \u2014 the VPN-detected reconcile **writes** tags (and reset/connected reconcile run here): `AddPlayerTagSubstrate()`.
- **`portal-server-events`** \u2014 the moderation cost gate **reads** `ModerateChat` (`IPlayerTagService.HasAsync`): `AddPlayerTagSubstrate()`.
- `portal-web` needs it only when a tag-reading surface moves there (Player Tags feature, later) \u2014 **not** in Phase 3.

### Tests
- `PlayerTagService`: writes set `SystemAssigned`; reads cache + invalidate; routes to the Repository tag API (mock the client).
- `TagCatalog`: duplicate tag type throws.
- `AddPlayerTagSubstrate()`: asserts `IRepositoryApiClient`.

**Gate:** publish the tag-substrate SDK version and consume it here **before** building `.Processing`.

---

## 1.0 — Provision the repo (platform-workloads prerequisite)

**Do:** Open a `platform-workloads` PR adding a workload JSON for `portal-feature-autoadmin` (repo + identity + NuGet publish), mirroring `portal-feature-maps`. Package/infra prerequisite — surface it first.

**Acceptance:** `frasermolyneux/portal-feature-autoadmin` exists with the `NuGet` environment/secret. **Gate:** do not proceed until it exists.

---

## 1.1 — Scaffold the repo

**Do:** As for the Maps repo — metadata (`update-project-metadata`), **library** workflows (`align-project-workflows`; no terraform/deploy), `.vscode/tasks.json`, `version.json` (`0.1`), and copy `Directory.Build.props` / `Directory.Packages.props` from `portal-feature-maps`.

**Acceptance:** empty solution builds; CI green.

---

## 1.2 — Solution & projects

**Do:** `src/XtremeIdiots.Portal.Features.AutoAdmin.sln` with:

| Project                                                        | SDK                       | TFMs             | Key references                                                                                                                                                                                                                             |
| -------------------------------------------------------------- | ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `XtremeIdiots.Portal.Features.AutoAdmin.Abstractions`          | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | `XtremeIdiots.Portal.FeatureSdk`, `MX.Api.Abstractions` (owns the `vpnProtection` + `moderation` contracts + validators)                                                                                                                   |
| `XtremeIdiots.Portal.Features.AutoAdmin.Web`                   | `Microsoft.NET.Sdk.Razor` | `net9.0;net10.0` | `XtremeIdiots.Portal.FeatureSdk.Web`, `.Abstractions`; `FrameworkReference Microsoft.AspNetCore.App`                                                                                                                                       |
| `XtremeIdiots.Portal.Features.AutoAdmin.Processing`            | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | `XtremeIdiots.Portal.FeatureSdk`, `.Abstractions`; `Azure.AI.ContentSafety` (the feature **provides** the client from host-supplied config via its options builder), `MX.GeoLocation.Api.Client.V1` if the VPN evaluator needs it directly |
| `XtremeIdiots.Portal.Features.AutoAdmin.*.Tests`               | test                      | `net9.0;net10.0` | package under test + `FeatureSdk.Testing` / `.Web.Testing`, xUnit, Moq                                                                                                                                                                     |
| `XtremeIdiots.Portal.Features.AutoAdmin.Web.IntegrationTests`  | test (non-packable)       | `net9.0;net10.0` | `.Web`, `.Abstractions`, `FeatureSdk.Web.Testing`, `Microsoft.Playwright`, xUnit, deterministic Repository/settings fakes                                                                                                                 |

Each package: `GeneratePackageOnBuild=true`, `PackageId` = project name, `Description`, `PackageReadmeFile=README.md`.

**Acceptance:** solution builds; three `.nupkg` produced.

> **Settings ownership (decision 13):** the `vpnProtection` / `moderation` typed contracts + validators are **feature-owned** in `AutoAdmin.Abstractions`. During side-by-side, ship a **wire-compatible copy** (identical JSON shape, same namespace strings) so persisted settings deserialize under both the legacy `Settings.Contracts.V1` path and the feature path. Phase 4 removes the central copies from `Settings.Contracts.V1`.

---

## 1.3 — `Features.AutoAdmin.Abstractions`

**Do:**
1. **`AutoAdminPermissions : IPermissionContributor`** — return `Players.ProtectedNames.Write` with its **exact** current metadata from `AdditionalPermission.Definitions` (claim type, display name, description, domain "Players", sub-domain "Protected Names", scope). Byte-identical.
2. **Settings contracts + validators** — define the `vpnProtection` and `moderation` contract types (`IFeatureSettingsContract` with `Namespace`/`Scope`) as **wire-compatible copies** of today's `Settings.Contracts.V1` shapes, plus an `IFeatureSettingsValidator<T>` for each carrying the current semantic rules. Any other AutoAdmin-owned feature-shaped models (e.g. `ProtectedNameContext`) live here too.
3. `AddAutoAdminFeatureContracts(this IServiceCollection s)` → `s.AddPermissionContributor<AutoAdminPermissions>();` **and** `s.AddFeatureSettings<VpnProtectionSettings, VpnProtectionSettingsValidator>()` + `AddFeatureSettings<ModerationSettings, ModerationSettingsValidator>()` so the writer can resolve/validate them.

**Acceptance:** a unit test asserts `AutoAdminPermissions.GetPermissions()` equals today's `Players.ProtectedNames.Write` snapshot; round-trip tests prove the feature contracts deserialize existing persisted `vpnProtection` / `moderation` JSON byte-for-byte.

---

## 1.4 — `Features.AutoAdmin.Processing`

Move the three sub-systems from `portal-server-events`; VPN + Protected Names become **connection collaborators** and Chat Moderation stays a **pipeline handler** (decision 17):

1. **VPN Protection → `IConnectionGuard` collaborator.** Move `VpnProtection/*` (`VpnProtectionService`, `VpnProtectionEvaluator`, `VpnProtectionRconEnforcer`, `Cod4xVpnProtectionPolicyProvider`, `VpnProtectionSettingsProvider`, contexts/models) and wrap it as **`AutoAdminConnectionGuard : IConnectionGuard`** — **not** an `IServerEventHandler`. VPN runs on **both** `PlayerConnected` and `PlayerIpResolved`; the platform core orchestration handlers call the guard on both, so one collaborator covers both. `GuardAsync` folds in the **VPN-detected tag write** (`IPlayerTagService.AddSystemTagAsync`) **and** the VPN kick, and sets **`c.GuardWasDestructive`** on a kick (so the greeter/welcome is suppressed — preserving today's behaviour). **Replace the per-game RCON `switch` in `VpnProtectionRconEnforcer`** with `IRconGateway.KickAsync(...)`. Declare `SupportedGames` matching today (CoD family). The **caller emits the audit event** (keep the existing audit).
2. **Chat Moderation → pipeline handler.** Move `Moderation/*` (`ChatModerationPipeline`, `ChatModerationService`, `ChatModerationSettingsProvider`, models). Create `ChatModerationHandler : IServerEventHandler<ChatMessageEvent>` (reaction, `Order = 260` — **after** the chat-command dispatch at 250) that runs the pipeline. Moderation is a **passive `Observation`**: it records an `AdminActionType.Observation` and never blocks the message or command (decision 15) — the handler returns `Task` and has **no effect on other handlers**. Preserve the `EventIngest.ChatToxicityDetection` flag check and the cost gate: **new-player window** (`ContentSafety:NewPlayerWindowDays`, supplied via the options builder — the feature cannot read host config) **or** the `ModerateChat` tag (read via the core `IPlayerTagService.HasAsync`; the events host must call `AddPlayerTagSubstrate()`). `PlayerFirstSeen` is not on the SDK context/`PlayerReference`, so the handler fetches it via `IRepositoryApiClient`. Consume a `ContentSafetyClient` the **feature provides** via its options builder (step 5).
3. **Protected Names → `IProtectedNameEnforcer` collaborator.** Move `Services/ProtectedNameService`, `ProtectedNameContext` and wrap as **`AutoAdminProtectedNameEnforcer : IProtectedNameEnforcer`** (`SupportedGames` = CoD4x) calling `CheckAsync`. **`IpAddressGuard` is shared** (IP persistence on connect + ip-resolved), so it **stays in the host** — do **not** move it.
4. **VPN-detected-tags reconcile (jobs).** Move `VpnDetectedTagReconciler` (today invoked by `portal-repository-func`'s `DataMaintenance.RunReconcileVpnDetectedTags`) into `ReconcileVpnDetectedTagsJob : IReconciliationJob` (`Set="PlayerTags"`, `Phase=Reconcile`, `Order` after the connected reconcile). It writes VPN-detected tags via the **core `IPlayerTagService`** (tag substrate, the pre-freeze SDK addition from [§0](#0--sdk-prerequisite-build-the-tag-substrate-pre-freeze-nuget-gate)) and contributes its tag definition via `ITagDefinitionContributor`. The `[TimerTrigger]`/`[HttpTrigger]` stub stays in `portal-repository-func` (wired in Part 2).
5. `AddAutoAdminFeatureProcessing(this IServiceCollection s, Action<AutoAdminProcessingOptions> configure)` → registers the **collaborators** `AddConnectionGuard<AutoAdminConnectionGuard>()` + `AddProtectedNameEnforcer<AutoAdminProtectedNameEnforcer>()`, the **moderation handler** via `AddServerEventHandler<ChatMessageEvent, ChatModerationHandler>()`, the **reconcile job** via `AddReconciliationJob<ReconcileVpnDetectedTagsJob>()`, and the **tag-definition contributor** via `AddTagDefinitionContributor<>()`, plus the VPN/moderation/protected-name services they depend on, **and** registers the `ContentSafetyClient` from host-supplied options (`opts.WithContentSafety(endpoint, credential).WithNewPlayerWindowDays(days).WithBotAdminId(botAdminId)` — `NewPlayerWindowDays` feeds the moderation cost gate; `BotAdminId` is used by moderation + Protected Names). Fail fast **when the moderation handler first runs** if Content Safety options are missing (a **lazy** check — so a timer host that registers the feature for the reconcile but never runs moderation, e.g. `portal-repository-func`, does not need Content Safety). Shared clients (`IRepositoryApiClient` / `IServersApiClient` / `IGeoLocationApiClient` / `IAuditLogger` / `IPlayerTagService`) are consumed from DI, never re-registered.

> No chat commands. AutoAdmin ships **two connection collaborators (guard + protected-name enforcer)**, **one moderation handler**, and **one reconciliation job** (VPN-detected tags).

**Acceptance:** unit tests (via `FeatureSdk.Testing` fakes) reproduce legacy behaviour: the guard's VPN kick + VPN-detected tag write + `GuardWasDestructive` on kick (mock `IRconGateway` / `IPlayerTagService`); moderation records an `Observation` (mock `ContentSafetyClient`) with **no effect on other handlers**; the protected-name enforcer on connect; the VPN-detected-tags reconcile writes the same tags. Characterization snapshots match pre-move.

---

## 1.5 — `Features.AutoAdmin.Web` (Razor Class Library)

Move from `portal-web`:
1. **Protected Names UI:** `ProtectedNamesController` + views (`_ProtectedNamesTable.cshtml`, `_ProtectedNameUsageTable.cshtml`). Keep routes/actions/policies (`Players.ProtectedNames.Write`) identical.
2. **Protected-names profile block:** the player-profile protected-names section → `ProtectedNamesProfileBlock : IPlayerProfileBlock` (order + `Players.ProtectedNames.Write` policy). It reads `PlayerEntityOptions.ProtectedNames` via the Repository client.
3. **VPN + Moderation settings sections** — extract the strongly-typed VPN/moderation settings UI currently woven into the `GlobalSettings` / `GameServers` pages (`VpnProtectionGlobalSettingsViewModel`, `VpnProtectionRuleViewModel`, `VpnProtectionSettingsViewModelValidation`, the moderation equivalents) into:
   - `VpnProtectionSettingsSection : ISettingsSection` (namespace `vpnProtection`, scope Both, policy `GlobalSettings.Admin` / `GameServers.Write` as today).
   - `ChatModerationSettingsSection : ISettingsSection` (namespace `moderation`, scope Both).
   Each section owns its view model + validators + partial view and binds against the **feature-owned** contract types in `AutoAdmin.Abstractions` (the wire-compatible copies). **This is the hardest step** — see the risk note in [README.md](README.md#main-risk-to-watch).
4. `AddAutoAdminFeatureWeb(this IServiceCollection s)` → `s.AddFeatureControllers(typeof(ProtectedNamesController).Assembly)` + `s.AddPlayerProfileBlock<ProtectedNamesProfileBlock>()` + `s.AddSettingsSection<VpnProtectionSettingsSection>()` + `s.AddSettingsSection<ChatModerationSettingsSection>()`.

**Acceptance:** unit tests cover contributors, binding, and validators. The feature-owned integration project launches the RCL in the `FeatureSdk.Web.Testing` reference host; protected-names routes, the profile block, and both settings sections are discovered without referencing `portal-web`; Playwright proves the workflows described below.

---

## 1.6 — Tests & 1.7 — Publish gate

**Unit/characterization tests:** permission snapshot; VPN **guard** collaborator (via `FakeRconGateway` + a fake `IPlayerTagService`, incl. `GuardWasDestructive` on kick); moderation records an `Observation` (mock Content Safety) with **no effect on other handlers**; protected-name **enforcer**; the VPN-detected-tags reconcile (mock `IPlayerTagService`); profile block/settings contributor output; contract serialization and validators.

**Feature-owned Playwright (`Web.IntegrationTests`):**
- Start `FeatureWebTestHostBuilder` with the AutoAdmin Web assembly, deterministic protected-name/API fakes, seeded global/per-server settings, and allowed/denied principals.
- Prove the Protected Names route/table workflow, including valid and invalid writes, expected recording-fake requests, and refreshed semantic UI.
- Prove the protected-names profile block renders for the supported game and allowed policy, and is absent for unsupported/denied contexts.
- Render VPN Protection and Chat Moderation sections in both global and game-server scopes. Exercise valid and invalid posts, field validation, override behaviour, and POST→GET persistence.
- Assert persisted `vpnProtection` and `moderation` JSON remains wire-compatible with fixtures from the legacy contract.
- Assert protected routes and contributed surfaces enforce their declared policies.
- Fail on browser console/page errors, same-origin request failures/5xx responses, or unexpected external requests.
- Use role/label/test-id assertions. Screenshot parity of portal-web's shared settings/profile layout remains a small host-owned check in Part 2.

**Validate:**
```pwsh
dotnet build src/XtremeIdiots.Portal.Features.AutoAdmin.sln
dotnet test  src/XtremeIdiots.Portal.Features.AutoAdmin.sln --filter "FullyQualifiedName!~IntegrationTests"
dotnet test  src/XtremeIdiots.Portal.Features.AutoAdmin.Web.IntegrationTests/XtremeIdiots.Portal.Features.AutoAdmin.Web.IntegrationTests.csproj --results-directory TestResults --logger "trx;LogFileName=playwright.trx"
# The CI action installs Chromium and fails unless TestResults/playwright.trx reports Counters.total > 0.
dotnet format src/XtremeIdiots.Portal.Features.AutoAdmin.sln --verify-no-changes
```

CI must execute the explicit integration-test project through the Phase 0 versioned `dotnet-playwright-tests` action (`test-project` input). The action installs Chromium, emits/publishes TRX, and fails if zero tests execute. Do not use the old solution-wide name-filter mode and do not publish on a workflow path that skipped this job.

**Publish gate (hard stop):** publish `.Abstractions` / `.Web` / `.Processing` to **NuGet.org** at `0.1.x` via the release flow (requester performs/reviews). Confirm a scratch app restores `Features.AutoAdmin.Web` + `.Processing`, and that the exact commit/tag being packaged passed `Web.IntegrationTests` against the published-version-compatible SDK reference host. **STOP** until this passes.

---

## Part 1 definition of done

- [ ] `portal-feature-autoadmin` provisioned, scaffolded (library repo), CI green.
- [ ] `.Abstractions` (`AutoAdminPermissions` + feature-owned `vpnProtection`/`moderation` contracts + validators), `.Processing` (VPN **guard collaborator**, protected-name **enforcer collaborator**, moderation **handler** [observation-only], **plus the VPN-detected-tags reconcile job**; ContentSafety via options builder incl. `NewPlayerWindowDays` + `BotAdminId`), `.Web` (protected-names UI + profile block + 2 settings sections) build.
- [ ] Feature contracts are **wire-compatible copies** — round-trip proven against existing persisted JSON; central `Settings.Contracts.V1` copies still present (removed in Phase 4).
- [ ] Tests reproduce legacy behaviour incl. moderation as a passive `Observation` (no effect on the command) and the VPN-detected-tags reconcile; permission snapshot exact.
- [ ] Feature-owned Playwright proves Protected Names, profile-block gating, both settings scopes, validation, wire-compatible round-trip, and browser diagnostics before publish.
- [ ] `dotnet format --verify-no-changes` clean.
- [ ] Packages published to NuGet.org `0.1.x` and restorable.
- [ ] `code-review` sub-agent run; High/Medium findings resolved.

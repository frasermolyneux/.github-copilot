# Phase 1 · Part 1 — Build & Publish `portal-feature-maps`

Create the Maps feature repo and its three packages, moving the maps code out of the five hosts into them. Ends at a **hard publish gate** — [Part 2](part-2-host-integration.md) does not start until the Maps packages restore from NuGet.org.

> Conventions, flag model, and the validated Maps footprint: [README.md](README.md). Prerequisite: Phase 0 SDK published and consumed.

---

## 1.0 — Provision the repo (platform-workloads prerequisite)

**Do:** Open a `platform-workloads` PR adding a workload JSON for `portal-feature-maps` (GitHub repo + identity + NuGet publish), mirroring `portal-feature-sdk`. Package/infra prerequisite — surface it first.

**Acceptance:** `frasermolyneux/portal-feature-maps` exists with the `NuGet` environment/secret. **Gate:** do not proceed until it exists.

---

## 1.1 — Scaffold the repo

**Do:** As for the SDK repo — metadata (`update-project-metadata`), **library** workflows (`align-project-workflows`: build-and-test, pr-verify, codequality, copilot-setup-steps, dependabot-automerge, release-version-and-tag, release-publish-nuget, dependabot; **no terraform / deploy**), `.vscode/tasks.json`, `version.json` (`0.1`), and copy `Directory.Build.props` / `Directory.Packages.props` from `portal-feature-sdk`.

**Acceptance:** empty solution builds; CI green.

---

## 1.2 — Solution & projects

**Do:** `src/XtremeIdiots.Portal.Features.Maps.sln` with:

| Project                                          | SDK                       | TFMs             | Key references                                                                                       |
| ------------------------------------------------ | ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `XtremeIdiots.Portal.Features.Maps.Abstractions` | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | `XtremeIdiots.Portal.FeatureSdk`, `MX.Api.Abstractions`                                              |
| `XtremeIdiots.Portal.Features.Maps.Web`          | `Microsoft.NET.Sdk.Razor` | `net9.0;net10.0` | `XtremeIdiots.Portal.FeatureSdk.Web`, `.Abstractions`; `FrameworkReference Microsoft.AspNetCore.App` |
| `XtremeIdiots.Portal.Features.Maps.Processing`   | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | `XtremeIdiots.Portal.FeatureSdk`, `.Abstractions`                                                    |
| `XtremeIdiots.Portal.Features.Maps.*.Tests`      | test                      | `net9.0;net10.0` | the package under test + `XtremeIdiots.Portal.FeatureSdk.Testing` / `.Web.Testing`, xUnit, Moq       |

Each package: `GeneratePackageOnBuild=true`, `PackageId` = project name, `Description`, `PackageReadmeFile=README.md`.

**Acceptance:** solution builds; three `.nupkg` produced.

---

## 1.3 — `Features.Maps.Abstractions`

**Do:**
1. **`MapsPermissions : IPermissionContributor`** — return the maps permission definitions currently in `AdditionalPermission.Definitions` (portal-repository abstractions): `Maps.Read`; `MapRotations.Read` / `MapRotations.Write` / `MapRotations.Deploy`; `GameServers.Maps.Read` / `GameServers.Maps.Deploy`. **Copy the exact `ClaimType`, `DisplayName`, `Description`, `Domain`, `SubDomain`, `Scope` values** — they must be byte-identical to today.
2. Any maps view models / DTOs that are maps-specific (most data comes from the Repository client DTOs — do **not** duplicate those).
3. `AddMapsFeatureContracts(this IServiceCollection s)` → `s.AddPermissionContributor<MapsPermissions>();` (no settings — Maps has no namespace).

**Acceptance:** a unit test asserts `MapsPermissions.GetPermissions()` equals a **snapshot** of today's maps entries from `AdditionalPermission.Definitions` (exact set + metadata).

---

## 1.4 — `Features.Maps.Processing`

**Do:** Move these from `portal-server-events` / `portal-sync` / `portal-repository-func`:
1. **Chat commands** — `MapVoteLikeCommand`, `MapVoteDislikeCommand` implementing the **SDK `IChatCommand`** (Phase 0 already refactored the in-host copies to the SDK contract; move them here). They must:
   - Declare `SupportedGames` matching today (the map-vote descriptors' `SupportedGameTypes`).
   - Get the current map via `IRconGateway.GetCurrentMapAsync(...)` — **delete** any local per-game `switch` (that logic now lives in the SDK gateway).
   - Use `IServerEventContext` / injected clients / `IAuditLogger` for the rest.
2. **Jobs** as SDK `IScheduledJob`:
   - `MapPopularityJob` (from `portal-repository-func`).
   - `MapImageSyncJob`, `MapRedirectSyncJob`, `RedirectToGameServerMapSyncJob`, `MapRotationCleanupJob` (from `portal-sync`).
   - Each preserves its cron string and behaviour; wrap in `IJobTelemetry` via the job runner; consume host-registered clients.
3. `AddMapsFeatureProcessing(this IServiceCollection s)` → registers the two `AddChatCommand<>()` and the five `AddScheduledJob<>()`.

> Maps ships **no `IServerEventHandler`** — `MapChange` persistence stays platform (Phase 0).

**Acceptance:** unit tests using `FeatureSdk.Testing` fakes reproduce legacy behaviour for both map-vote commands (mock `IRconGateway` for current map) and each job (mock the Repository/Servers clients); characterization snapshots match the pre-move behaviour.

---

## 1.5 — `Features.Maps.Web` (Razor Class Library)

**Do:** Move from `portal-web`:
1. **MVC controllers + views:** `MapsController`, `MapManagerController`, `MapRotationsController` and their `Views/` into the RCL. Keep routes, action names, and policies **identical**. Reuse the central design system (Bootstrap + portal-web tokens/UI-standards) — **no npm** in this package; ship compiled CSS via `_content/` only if strictly needed.
2. **API controller:** the maps datatable endpoint (`ApiControllers/MapsController`). **Watch out:** if a *shared* controller (e.g. a generic `DataController`) contains a maps branch, do **not** move the shared controller — extract only the maps-specific action/logic, or leave the shared controller and have it delegate. Confirm by reading the controller before moving.
3. **Helpers/tag helpers:** `MapPopularityTagHelper`, `MapRotationCfgParser`.
4. **`MapsNavigation : INavigationContributor`** — reproduce today's maps nav entry (text "Maps", icon `fa-map`, the Servers group placement, `MapRotations.Read` policy, `data-testid`, order). Declare `SupportedGames` = all (or match today).
5. `AddMapsFeatureWeb(this IServiceCollection s)` → `s.AddFeatureControllers(typeof(MapsController).Assembly)` (ApplicationPart) + `s.AddNavigationContributor<MapsNavigation>()`.

**Acceptance:** a minimal `WebApplicationFactory` test in the package hosts the RCL, and the maps routes render; nav item appears with the correct policy + game gating.

---

## 1.6 — Tests

Cover: `MapsPermissions` snapshot equality; both map-vote commands (via `FakeRconGateway` / fake context); each job's Repository writes vs a fixture; nav contributor output; controller routing via `WebApplicationFactory`.

**Validate:**
```pwsh
dotnet build src/XtremeIdiots.Portal.Features.Maps.sln
dotnet test  src/XtremeIdiots.Portal.Features.Maps.sln
dotnet format src/XtremeIdiots.Portal.Features.Maps.sln --verify-no-changes
```

---

## 1.7 — Publish gate (hard stop)

**Do:** Publish `XtremeIdiots.Portal.Features.Maps.Abstractions` / `.Web` / `.Processing` to **NuGet.org** at `0.1.x` via `Release - Version and Tag` → `Release - Publish NuGet` (requester performs/reviews the merge + publish).

**Acceptance / gate:**
- The three packages are on NuGet.org at `0.1.x`.
- A scratch app restores `Features.Maps.Web` (pulling `FeatureSdk.Web`) and `Features.Maps.Processing` without error.

**STOP.** Do not start [part-2-host-integration.md](part-2-host-integration.md) until this gate passes.

---

## Part 1 definition of done

- [ ] `portal-feature-maps` provisioned, scaffolded (library repo), CI green.
- [ ] `.Abstractions` (MapsPermissions), `.Processing` (2 commands + 5 jobs), `.Web` (RCL controllers/views/nav/tag helper) build.
- [ ] Tests reproduce legacy maps behaviour; permission snapshot exact.
- [ ] `dotnet format --verify-no-changes` clean.
- [ ] Maps packages published to NuGet.org `0.1.x` and restorable.
- [ ] `code-review` sub-agent run; High/Medium findings resolved.

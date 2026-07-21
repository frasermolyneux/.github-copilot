# Phase 2 — Retirement Plan (Per-Host)

Delete the legacy maps implementation and the `Feature.Maps.V2` flag, host by host, validating after each. Preconditions and ordering: [README.md](README.md).

> Work host-by-host. For each host: (1) make the Maps package path **unconditional**, (2) **delete** the legacy maps code, (3) **validate**. Do not remove the flag definition until every host is done.

---

## 2.A — `portal-web`

**Do:**
1. Remove the `if (features.IsEnabled("Maps.V2"))` guard around `AddMapsFeatureContracts().AddMapsFeatureWeb()` — register unconditionally.
2. Remove the `MapsLegacyExclusionConvention` registration (the legacy controllers are about to be deleted).
3. **Delete** the legacy in-host maps code:
   - `Controllers/MapsController.cs`, `Controllers/MapManagerController.cs`, `Controllers/MapRotationsController.cs` and their `Views/Maps`, `Views/MapManager`, `Views/MapRotations`.
   - the legacy maps `ApiController` action(s) — **but** keep any shared controller (e.g. a generic `DataController`); only remove maps-specific bits if they were left behind.
   - `Helpers/MapPopularityTagHelper.cs`, the legacy `MapRotationCfgParser` (now in the package), and the legacy maps nav contributor.
4. **Permissions:** make the in-host `IPermissionContributor` exclude the maps domains **unconditionally** (Maps' permissions now come solely from `MapsPermissions`). The composed policy set and claim-type strings must be unchanged.

**Acceptance:** build (Release) + test + format green; Playwright snapshots of the maps pages/nav match; policy set unchanged; no `Maps.V2` reference remains in `portal-web`.

---

## 2.B — `portal-server-events`

**Do:**
1. Remove the `Feature.Maps.V2` guard around `AddMapsFeatureProcessing()` — register unconditionally.
2. **Delete** the legacy in-host `MapVoteLikeCommand` / `MapVoteDislikeCommand` and their registrations.
3. Leave `PersistMapChangeHandler` (platform core) untouched.

**Acceptance:** characterization for `!like` / `!dislike` unchanged; no duplicate command registration; build/test/format green; no `Maps.V2` reference remains.

---

## 2.C — `portal-repository-func`

**Do:**
1. Remove the `Feature.Maps.V2` guard around `AddMapsFeatureProcessing()` — register unconditionally.
2. **Delete** the legacy in-host `MapPopularity` job body (the `[TimerTrigger]`/`[HttpTrigger]` **stub stays** and continues to call `IJobRunner.RunAsync("MapPopularity")`, now resolving the package job).

**Acceptance:** `MapPopularity` writes unchanged; schedule unchanged; build/test/format green; no `Maps.V2` reference remains.

---

## 2.D — `portal-sync`

**Do:**
1. Remove the `Feature.Maps.V2` guard around `AddMapsFeatureProcessing()` — register unconditionally.
2. **Delete** the legacy in-host `MapImageSync` / `MapRedirectSync` / `RedirectToGameServerMapSync` / `MapRotationCleanup` job bodies (trigger **stubs stay**, calling the runner).

**Acceptance:** each map-sync job's writes/blob effects unchanged; idempotent; schedules unchanged; build/test/format green; no `Maps.V2` reference remains.

---

## 2.E — `portal-repository`

**Do:** No code change required. The central `AdditionalPermission.Definitions` may still contain the maps entries — that is harmless (structural validation is authoritative; portal-web surfaces maps perms via `MapsPermissions`). Removing the maps entries from the central list is a **later, cross-feature consolidation** (a coordinated portal-repository abstractions release) — **out of scope** here.

**Acceptance:** unchanged; no action.

---

## 2.F — Remove the flag (only after 2.A–2.D are all clean)

**Do:**
1. Confirm no host references `Feature.Maps.V2` (grep across the five repos).
2. **Remove** the `Feature.Maps.V2` flag definition from Azure App Configuration (dev + prd labels) — a manual App Config delete (or `portal-environments` cleanup).

**Acceptance:** flag gone. **The SDK is not frozen here** — it stays at `0.x` (the `v1.0` freeze is Phase 4, after AutoAdmin).

---

## ✅ Phase 2 exit gate

- [ ] All five hosts register the Maps packages **unconditionally**; no `Feature.Maps.V2` reference anywhere.
- [ ] Legacy maps controllers/views/nav/commands/jobs deleted; hosts net-negative maps LOC.
- [ ] `MapsLegacyExclusionConvention` removed; no route collisions; policy set unchanged.
- [ ] Build/test/format + characterization/Playwright green in all five hosts.
- [ ] `Feature.Maps.V2` removed from App Config.
- [ ] `code-review` sub-agent run per repo; High/Medium findings resolved.

**Outcome:** Maps lives entirely in `portal-feature-maps`; the estate is proven for the [per-feature migration recipe](../portal-features-spec/feature-catalog.md#per-feature-migration-recipe) to repeat for AutoAdmin, the Chat cluster, and the rest.

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

# portal-repository-func / portal-sync — build, test, format per each AGENTS.md
```

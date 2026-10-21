# Phase 1 · Part 2 — Integrate Maps Behind `Feature.Maps.V2` (Side-by-Side)

Reference the published Maps packages in the five hosts and register them **flag-gated**, running **side-by-side** with legacy. **Exactly one path runs per environment**: flag **off** = legacy (unchanged), flag **on** = the Maps packages. Legacy code stays (removed in [Phase 2](../portal-features-phase-2/README.md)).

> Prerequisite: the [Part 1 publish gate](part-1-feature-build.md#17--publish-gate-hard-stop) passed. Flag model + corrections: [README.md](README.md).

The flag is **evaluated at startup** (DI registration + MVC controller exclusion are composed once), so flipping `Feature.Maps.V2` takes effect on the **next host restart** — no redeploy.

---

## 2.0 — Prerequisites

1. **Create the flag** `Feature.Maps.V2` in Azure App Configuration for **both** `dev` and `prd` labels, default **off**. The feature name is the bare string `Maps.V2` (key `FeatureManagement:Maps.V2`, matching `IsEnabled("Maps.V2")`; `Feature.Maps.V2` is the prose label). **Seed it once** (default off) as a `portal-environments` change; **flips are manual** App Config edits per label — no Terraform apply, no redeploy.
2. **Reference the Maps packages** at `0.1.x`: `portal-web` → `.Abstractions` + `.Web`; `portal-server-events` → `.Abstractions` + `.Processing`; `portal-repository-func` + `portal-sync` → `.Abstractions` + `.Processing`.
3. **Baselines:** first confirm the published Maps commit passed its feature-owned Playwright suite. With the host flag **off**, capture semantic host-composition baselines for discovery of the maps routes, maps-in-nav visibility, real portal authorization, and real layout rendering; retain only the selected shared-shell screenshots in portal-web's small visual suite. Capture characterization snapshots for the map-vote commands and five jobs. Do not duplicate Maps CRUD/deploy workflows in `portal-web`.

**Acceptance:** flag exists (off); packages restore in each host; baselines captured; hosts build/test/format green.

---

## 2.A — `portal-web`

1. **Flag-gated registration** in `Program.cs`:
   ```csharp
   if (features.IsEnabled("Maps.V2"))
       builder.Services.AddMapsFeatureContracts().AddMapsFeatureWeb();
   // else: the legacy in-host maps controllers / nav / permission entries stay active
   ```
2. **Legacy controller exclusion** (only when the flag is on): add a `MapsLegacyExclusionConvention : IApplicationModelConvention` registered via `AddControllersWithViews(o => o.Conventions.Add(...))` **when `Maps.V2` is on**, that removes the legacy `MapsController` / `MapManagerController` / `MapRotationsController` (and the legacy maps `ApiController`) from the application model so only the RCL controllers route. Without this, the two `MapsController`s collide.
3. **Navigation:** when the flag is on, the `MapsNavigation` contributor from the package supplies the maps nav item; **suppress the legacy in-host maps nav contributor** (guard its registration with the flag) so the item is not duplicated.
4. **Permissions:** when the flag is on, `AddMapsFeatureContracts()` registers `MapsPermissions`; **exclude the maps entries** from the legacy in-host `IPermissionContributor` (the one added in Phase 0 that returns the full `AdditionalPermission.Definitions`) so the catalog does not throw on duplicate claim types. The claim-type strings and the composed policy set must be **identical** in both flag states.
5. Do not touch API-client / App-Config wiring.

**Acceptance (2.A):** start independent test hosts with `FeatureManagement:Maps.V2=false` and `true`. Off matches the legacy semantic baseline; on proves the RCL `ApplicationPart` is discovered, the same routes resolve exactly once, Maps nav is not duplicated, real host policies allow/deny correctly, and representative pages render in the real portal layout. The composed policy set is identical and the small shared-shell visual baseline remains green. Feature CRUD/deploy workflows are not repeated here. `dotnet build` (Release) + unit/integration tests + format green.

---

## 2.B — `portal-server-events`

1. **Flag-gated registration:**
   ```csharp
   if (features.IsEnabled("Maps.V2"))
       services.AddMapsFeatureContracts().AddMapsFeatureProcessing();  // registers the package MapVote commands
   // else: the in-host MapVoteLike/Dislike IChatCommand registrations stay
   ```
   When the flag is on, **do not** also register the legacy in-host `MapVoteLike/Dislike` commands (guard those registrations with the flag) — otherwise the `ChatCommandDispatchHandler` sees two `!like` handlers.
2. **`MapChange` is untouched** — `PersistMapChangeHandler` (platform core) stays; Maps ships no event handler.
3. `AddMapsFeatureContracts()` here also re-registers `MapsPermissions`; that is harmless (the catalog is only *authoritative* in portal-web) but keep it consistent — or omit it in the events host and register only `AddMapsFeatureProcessing()`.

**Acceptance (2.B):** characterization for `!like` / `!dislike` is identical to baseline in both flag states (mock `IRconGateway`); no duplicate command dispatch; build/test/format green.

---

## 2.C — `portal-repository-func`

1. **Flag-gated job registration:**
   ```csharp
   if (features.IsEnabled("Maps.V2"))
       services.AddMapsFeatureProcessing();   // registers MapPopularityJob (IScheduledJob "MapPopularity")
   // else: the in-host MapPopularity job registration stays
   ```
2. The host `[TimerTrigger]` + manual `[HttpTrigger]` **stub stays** and calls `IJobRunner.RunAsync("MapPopularity")`; the runner resolves whichever `MapPopularity` job is registered (legacy or package) — never both.

**Acceptance (2.C):** `MapPopularity` produces identical Repository writes vs baseline in both flag states; schedule unchanged; build/test/format green.

---

## 2.D — `portal-sync`

1. **Flag-gated job registration:**
   ```csharp
   if (features.IsEnabled("Maps.V2"))
       services.AddMapsFeatureProcessing();   // MapImageSync/MapRedirectSync/RedirectToGameServerMapSync/MapRotationCleanup
   // else: the in-host map-sync job registrations stay
   ```
2. Keep the timer/manual trigger **stubs** in the host, calling `IJobRunner.RunAsync("<JobName>")`.

**Acceptance (2.D):** each map-sync job produces identical Repository writes / blob effects vs baseline in both flag states; idempotent; schedules unchanged; build/test/format green.

---

## 2.E — Cutover (enable, validate, soak)

1. **Enable in dev** — set `Feature.Maps.V2 = on` (dev label); restart the five hosts.
2. **Validate in dev** — run the full characterization harness and thin host-composition Playwright suite with the flag **on**; then flip **off** + restart and confirm legacy parity. Both states must match the semantic baseline. The Maps feature-repository Playwright suite remains the workflow oracle.
3. **Enable in prd** — set the flag on (prd label); restart; **soak** for the agreed window, monitoring App Insights (errors, dependency calls, job telemetry).
4. **Do not remove legacy** — that is Phase 2.

**Acceptance (2.E):** Maps served from packages when on, legacy when off, both behaviourally identical; prd soak clean.

---

## ✅ Phase 1 exit gate

- [ ] Five hosts reference the Maps packages and register them behind `Feature.Maps.V2`.
- [ ] Flag **off** = legacy (unchanged); flag **on** = feature packages; **exactly one path** runs.
- [ ] No route collisions (exclusion convention working); nav not duplicated; policy set identical; no duplicate commands/jobs.
- [ ] Characterization + host-composition Playwright parity in **both** flag states; published Maps feature-owned Playwright suite green.
- [ ] `Feature.Maps.V2` on in dev and prd, soaked, no regressions.
- [ ] Legacy maps code still present and functional when the flag is off.
- [ ] Build/test/format green in all five hosts; `code-review` run per repo.

**Next:** [Phase 2](../portal-features-phase-2/README.md) removes the legacy maps code and the flag once this side-by-side is validated in prd.

---

## Per-host validation commands

```pwsh
# portal-web
dotnet build src/XtremeIdiots.Portal.Web/XtremeIdiots.Portal.Web.csproj
dotnet test  src --filter "FullyQualifiedName!~IntegrationTests"
dotnet test  src/XtremeIdiots.Portal.Web.IntegrationTests/XtremeIdiots.Portal.Web.IntegrationTests.csproj
dotnet format src/XtremeIdiots.Portal.Web.sln --verify-no-changes

# portal-server-events
dotnet build src/XtremeIdiots.Portal.Server.Events.slnx
dotnet test  src/XtremeIdiots.Portal.Server.Events.slnx --filter "FullyQualifiedName!~IntegrationTests"
dotnet format src/XtremeIdiots.Portal.Server.Events.slnx --verify-no-changes

# portal-repository-func / portal-sync — build, test, format per each AGENTS.md
```

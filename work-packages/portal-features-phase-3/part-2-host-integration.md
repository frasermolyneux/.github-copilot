# Phase 3 · Part 2 — Integrate AutoAdmin Behind `Feature.AutoAdmin.V2` (Side-by-Side)

Reference the published AutoAdmin packages in the **three** hosts and register them **flag-gated**, running **side-by-side** with legacy. **Exactly one path runs per environment**: flag **off** = legacy, **on** = the AutoAdmin packages. Legacy stays (removed in [Phase 4](../portal-features-phase-4/README.md)).

> Prerequisite: the [Part 1 publish gate](part-1-feature-build.md#16--tests--17--publish-gate) passed. Footprint + risk: [README.md](README.md). The flag is **startup-evaluated** (flip + host restart, no redeploy).

Hosts touched: **`portal-server-events`**, **`portal-web`**, and **`portal-repository-func`** (the VPN-detected-tags reconcile job). `portal-repository`, `portal-sync`, and `portal-servers-integration` are **not** changed.

---

## 2.0 — Prerequisites

1. **Create the flag** `Feature.AutoAdmin.V2` in App Configuration for `dev` and `prd`, default **off**. The feature name is the bare string `AutoAdmin.V2` (key `FeatureManagement:AutoAdmin.V2`, matching `IsEnabled("AutoAdmin.V2")`; `Feature.AutoAdmin.V2` is the prose label). **Seed it once** (default off) as a `portal-environments` change; **flips are manual** App Config edits per label — no Terraform apply, no redeploy.
2. **Reference the packages** at `0.1.x`: `portal-server-events` → `.Abstractions` + `.Processing`; `portal-web` → `.Abstractions` + `.Web`; `portal-repository-func` → `.Abstractions` + `.Processing` (for the VPN-detected-tags reconcile job).
3. **Baselines (flag off):** characterization snapshots for the moderation pipeline (a toxic message → `Observation` recorded, command **still dispatched** — moderation never skips it), the VPN kick decision on **both connect and ip-resolved** (incl. the **welcome being suppressed when VPN kicks on connect**), the VPN-detected tag written in real time on connect/ip-resolved, and the protected-name check on connect; Playwright snapshots for the Protected Names page, the protected-names profile block, and the **VPN + Moderation sections** on both the global settings page and a game-server settings page.

**Acceptance:** flag exists (off); packages restore; baselines captured; hosts build/test/format green.

---

## 2.A — `portal-server-events`

1. **Flag-gated registration:**
   ```csharp
   services.AddPlayerTagSubstrate();   // moderation's cost gate reads the ModerateChat tag via IPlayerTagService
   if (features.IsEnabled("AutoAdmin.V2"))
       services.AddAutoAdminFeatureContracts()
               .AddAutoAdminFeatureProcessing(opts => opts
                   .WithContentSafety(cfg["ContentSafety:Endpoint"], credential)
                   .WithNewPlayerWindowDays(int.Parse(cfg["ContentSafety:NewPlayerWindowDays"] ?? "7"))
                   .WithBotAdminId(cfg["ContentSafety:BotAdminId"]));   // host supplies config; feature registers the client
   // else: the in-host connection guard/enforcer + moderation handler stay registered
   ```
   When the flag is **on**, the package supplies the `IConnectionGuard` (VPN), `IProtectedNameEnforcer`, and the `ChatModerationHandler`; **suppress the legacy in-host registrations** of those (guard them behind the flag) so exactly one implementation of each collaborator and one moderation handler runs. The platform `PlayerConnected` / `PlayerIpResolved` core orchestration handlers are **unchanged** — only which guard/enforcer they call changes.
2. **Move `ContentSafetyClient` registration into the feature** — the host stops registering it when the flag is on; it passes `ContentSafety:Endpoint` (+ credential), `NewPlayerWindowDays`, and `BotAdminId` into the feature's options builder instead. (The legacy registration stays only for the flag-off path; Phase 4 removes it.)
3. **Ordering & coupling:** confirm `ChatModerationHandler` runs at `Order = 260` (**after** command dispatch at 250), records an `Observation`, and has **no effect on the command**; and confirm the connect coupling holds in both flag states — the guard's kick sets `GuardWasDestructive` so the **welcome is suppressed** exactly as today.

**Acceptance (2.A):** characterization identical in both flag states — moderation records an `Observation` **after** command dispatch and does **not** skip the command; the VPN guard kicks on **both** connect and ip-resolved and **suppresses the welcome on a connect kick**; the protected-name enforcer runs on connect; no duplicate collaborators/handlers; build/test/format green.

---

## 2.B — `portal-web`

1. **Flag-gated registration:**
   ```csharp
   if (features.IsEnabled("AutoAdmin.V2"))
       builder.Services.AddAutoAdminFeatureContracts().AddAutoAdminFeatureWeb();
   // else: legacy in-host ProtectedNamesController / profile block / VPN+moderation sections / permission entry stay
   ```
2. **Legacy controller exclusion** (flag on): register an `AutoAdminLegacyExclusionConvention : IApplicationModelConvention` that removes the **legacy `ProtectedNamesController`** from the application model so only the RCL controller routes. *(The VPN/moderation settings sections and the profile block switch purely via DI registration — no controller collision — so they need no convention.)*
3. **Profile block:** when the flag is on, the package `ProtectedNamesProfileBlock` supplies the profile section; **suppress** the legacy in-host protected-names block registration.
4. **Settings sections:** when the flag is on, the package `VpnProtectionSettingsSection` + `ChatModerationSettingsSection` render on the global + game-server settings pages; **suppress** the legacy in-host VPN/moderation sections. Verify round-trip (save/load) is byte-identical against the **feature-owned** (wire-compatible) contracts.
5. **Permissions:** when the flag is on, `AutoAdminPermissions` provides `Players.ProtectedNames.Write`; **exclude** it from the legacy in-host permission contributor (avoid duplicate-claim). Composed policy set unchanged.

**Acceptance (2.B):** with the flag **off**, everything matches baseline. With the flag **on** (dev): Playwright snapshots of the Protected Names page, the profile block, and the VPN/moderation settings sections (global + per-server) match; settings save/load round-trips identically; no route collision; policy set unchanged; `dotnet build` (Release) + test + format green.

---

## 2.C — `portal-repository-func` (VPN-detected-tags reconcile)

1. **Flag-gated job registration:**
   ```csharp
   services.AddPlayerTagSubstrate();   // the reconcile writes VPN-detected tags via IPlayerTagService
   if (features.IsEnabled("AutoAdmin.V2"))
       services.AddAutoAdminFeatureContracts().AddAutoAdminFeatureProcessing(_ => { });   // no Content Safety here — moderation never runs in this host (lazy assert)
   // else: the in-host DataMaintenance.RunReconcileVpnDetectedTags body stays
   ```
   The host `[TimerTrigger]` (`0 0 4 * * *`) + manual `[HttpTrigger]` **stub stays** and calls `IJobRunner.RunAsync("ReconcileVpnDetectedTags")`; the runner resolves whichever registration is active (legacy or package) — never both. Guard the legacy in-host `ReconcileVpnDetectedTags` body off when the flag is on.
2. This host calls **`AddPlayerTagSubstrate()`** (shown above) so the reconcile job can write tags via the core `IPlayerTagService`.

**Acceptance (2.C):** the VPN-detected-tags reconcile produces identical tag writes vs baseline in both flag states; the 03:00 → 03:30 → 04:00 tag-reconcile ordering is preserved; build/test/format green.

---

## 2.D — Cutover (enable, validate, soak)

1. **Enable in dev** — `Feature.AutoAdmin.V2 = on` (dev label); restart the three hosts.
2. **Validate in dev** — full characterization + Playwright with the flag **on**; then flag **off** + restart and confirm legacy parity. Pay special attention to the **moderation observation** (fires after command dispatch, does not block), the **settings round-trip**, and the **VPN-detected-tags reconcile**.
3. **Enable in prd** — flag on (prd label); restart; **soak**, monitoring App Insights (moderation/VPN audit events, Content Safety dependency calls, errors).
4. **Do not remove legacy** — that is Phase 4.

**Acceptance (2.D):** AutoAdmin served from packages when on, legacy when off, both identical; prd soak clean.

---

## ✅ Phase 3 exit gate

- [ ] `portal-server-events` + `portal-web` + `portal-repository-func` reference the AutoAdmin packages, flag-gated.
- [ ] Flag **off** = legacy; **on** = feature; **exactly one path** runs (incl. the VPN-detected-tags reconcile).
- [ ] No route collision (protected-names convention); no duplicate collaborators/handlers/blocks/sections/jobs; policy set identical; settings round-trip identical.
- [ ] Moderation runs at `Order = 260` (after command dispatch) and is observation-only (records an `Observation`, no effect on the command), preserved in both states.
- [ ] The VPN guard runs on **both** connect + ip-resolved and **suppresses the welcome on a connect kick** (connection coupling preserved) in both flag states.
- [ ] Tag-reconcile ordering (03:00 reset → 03:30 connected → 04:00 VPN-detected) preserved.
- [ ] Characterization + Playwright parity in both flag states.
- [ ] `Feature.AutoAdmin.V2` on in dev and prd, soaked, no regressions.
- [ ] Legacy VPN/moderation/protected-names code still present and functional when off.
- [ ] Build/test/format green in all three hosts; `code-review` run per repo.

**Next:** [Phase 4](../portal-features-phase-4/README.md) removes the legacy AutoAdmin code and the flag once this side-by-side is validated in prd.

---

## Per-host validation commands

```pwsh
# portal-server-events
dotnet build src/XtremeIdiots.Portal.Server.Events.slnx
dotnet test  src/XtremeIdiots.Portal.Server.Events.slnx --filter "FullyQualifiedName!~IntegrationTests"
dotnet format src/XtremeIdiots.Portal.Server.Events.slnx --verify-no-changes

# portal-web
dotnet build src/XtremeIdiots.Portal.Web/XtremeIdiots.Portal.Web.csproj
dotnet test  src --filter "FullyQualifiedName!~IntegrationTests"
dotnet format src/XtremeIdiots.Portal.Web.sln --verify-no-changes
```

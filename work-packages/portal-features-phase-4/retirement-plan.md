# Phase 4 — Retirement Plan (Per-Host)

Delete the legacy AutoAdmin implementation and the `Feature.AutoAdmin.V2` flag, host by host, validating after each. Preconditions and ordering: [README.md](README.md).

> Three hosts: `portal-server-events`, `portal-web`, and `portal-repository-func`. For each: (1) make the package path **unconditional**, (2) **delete** the legacy code, (3) **validate**. Remove the flag definition only after all three hosts are done.

---

## 4.A — `portal-server-events`

**Do:**
1. Remove the `if (features.IsEnabled("AutoAdmin.V2"))` guard around `AddAutoAdminFeatureContracts().AddAutoAdminFeatureProcessing(opts => opts.WithContentSafety(...).WithNewPlayerWindowDays(...).WithBotAdminId(...))` — register unconditionally (the feature still receives `ContentSafety:Endpoint` + credential + `NewPlayerWindowDays` + `BotAdminId` from host config via the options builder). Keep `AddPlayerTagSubstrate()`.
2. **Delete** the legacy in-host code and its registrations:
   - `VpnProtection/*` (service, evaluator, RCON enforcer, CoD4x policy provider, settings provider, contexts/models) and the legacy in-host **`IConnectionGuard`** implementation.
   - `Services/ProtectedNameService`, `ProtectedNameContext`, and the legacy in-host **`IProtectedNameEnforcer`** implementation.
   - `Moderation/*` (`ChatModerationPipeline`, service, settings provider, models) and the legacy in-host **`ChatModerationHandler`**.
   - **Keep `IpAddressGuard`** — it is shared (IP persistence on connect + ip-resolved), not AutoAdmin-only.
3. **Remove** the host's own `ContentSafetyClient` registration — the feature now owns it (registered from host-supplied options). The host keeps supplying `ContentSafety:Endpoint`, **`NewPlayerWindowDays`**, and **`BotAdminId`** into the options builder.
4. Leave the persistence/core handlers untouched — including the **`PlayerConnected` / `PlayerIpResolved` core orchestration handlers** (they now call the package guard/enforcer), `PersistChatMessageHandler`, etc.

**Acceptance:** characterization unchanged (moderation records an `Observation` **after** command dispatch; the VPN guard runs on **both** connect + ip-resolved and **suppresses the welcome on a connect kick**; protected-name enforcer on connect); no duplicate collaborators/handlers; build/test/format green; no `AutoAdmin.V2` reference remains.

---

## 4.B — `portal-web`

**Do:**
1. Remove the `Feature.AutoAdmin.V2` guard around `AddAutoAdminFeatureContracts().AddAutoAdminFeatureWeb()` — register unconditionally.
2. Remove the `AutoAdminLegacyExclusionConvention` registration.
3. **Delete** the legacy in-host code:
   - `ProtectedNamesController` + views (`_ProtectedNamesTable`, `_ProtectedNameUsageTable`) and the legacy protected-names profile block.
   - the in-host VPN + moderation **settings sections** and their view models/validators (`VpnProtectionGlobalSettingsViewModel`, `VpnProtectionRuleViewModel`, `VpnProtectionSettingsViewModelValidation`, the moderation equivalents) now that they live in the package sections. **Watch out:** these were woven into the shared `GlobalSettings` / `GameServers` pages — remove only the VPN/moderation binding, leaving the shared pages and their other sections intact.
4. **Permissions:** make the in-host `IPermissionContributor` exclude `Players.ProtectedNames.Write` **unconditionally** (now sourced from `AutoAdminPermissions`). Composed policy set and claim strings unchanged.
5. Leave the moderation **analytics/dashboard** code (`AnalyticsController` `global/moderation`, dashboard moderation tile) — that is the Analytics feature, not AutoAdmin.

**Acceptance:** build (Release) + test + format green; Playwright snapshots of the Protected Names page, the profile block, and the VPN/moderation settings sections (global + per-server) match; settings round-trip identical; policy set unchanged; no `AutoAdmin.V2` reference remains.

---

## 4.C — `portal-repository-func` (VPN-detected-tags reconcile)

**Do:**
1. Remove the `Feature.AutoAdmin.V2` guard around the AutoAdmin registration — register unconditionally so the package `ReconcileVpnDetectedTagsJob` is always the one the runner resolves (keep `AddPlayerTagSubstrate()` so the reconcile can write tags via `IPlayerTagService`).
2. **Delete** the legacy in-host `RunReconcileVpnDetectedTags` job **body** (`_vpnDetectedTagReconciler.ReconcileAsync(...)`) from `DataMaintenance.cs`. **Keep** the `[TimerTrigger]` (`0 0 4 * * *`) + manual `[HttpTrigger]` **stub** — it now calls `IJobRunner.RunAsync("ReconcileVpnDetectedTags")` resolving the package job.
3. Leave the other `DataMaintenance` jobs (prunes, `ResetSystemAssignedPlayerTags`, `ReconcileConnectedPlayerTags`) untouched — the **reset** and the **connected** reconcile stay platform / Player Tags.

**Acceptance:** the VPN-detected-tags reconcile writes identical tags vs baseline; the 03:00 → 03:30 → 04:00 ordering holds; build/test/format green; no `AutoAdmin.V2` reference remains.

---

## 4.D — Remove the flag (only after 4.A + 4.B + 4.C are clean)

**Do:**
1. Confirm no host references `Feature.AutoAdmin.V2` (grep all three repos).
2. **Remove** the `Feature.AutoAdmin.V2` flag definition from App Configuration (dev + prd) — a manual App Config delete (or `portal-environments` cleanup).

**Acceptance:** flag gone; AutoAdmin served entirely from `portal-feature-autoadmin`.

> **The SDK freeze is the final step ([4.F](#4f--freeze-the-sdk-at-v10-only-after-4a4e))** — do it after the flag (4.D) and the central contracts (4.E) are gone.

---

## 4.E — Remove the central settings contracts (coordinated platform-package change)

**Do:** now that AutoAdmin owns the `vpnProtection` / `moderation` contracts, **delete the central copies** from `XtremeIdiots.Portal.Settings.Contracts.V1` and publish the shrunk platform package. Because the persisted format is `namespace` + opaque JSON and the feature ships a **wire-compatible copy**, no data migration is required.

1. Remove the `vpnProtection` + `moderation` contract types + validators from `Settings.Contracts.V1`; bump + publish the platform package.
2. Confirm no consumer still references those types from `Settings.Contracts.V1` (grep the estate) — the only consumers are AutoAdmin's own package now.
3. Flip the **org guidance** for the `vpnProtection` / `moderation` namespaces to feature-owned as part of the deferred governance step — [decisions.md § Deferred governance](../portal-features-spec/decisions.md#deferred-governance-settings-contract-guidance-reconciliation). Do this in the same coordinated change so the `code-review` agent and repo instructions never disagree with the code.

**Acceptance:** `Settings.Contracts.V1` no longer defines the AutoAdmin namespaces; estate builds against the new platform-package version; persisted settings still resolve via the feature contracts.

---

## 4.F — Freeze the SDK at `v1.0` (only after 4.A–4.E)

**Do:** now that AutoAdmin has proven the settings, profile-block, reconciliation, tag-substrate, and connection-collaborator planes **from a package** (and Maps proved the rest), freeze the walking-skeleton SDK.
1. In `portal-feature-sdk`, bump `version.json` to `1.0` and tag `v1.0` via the release flow. Contracts are **additive-only** thereafter.
2. SDK-dependent feature repos + hosts move to `v1.0` at their next change (no forced bump).

**Acceptance:** `portal-feature-sdk` published at `v1.0`; the estate builds against it.

---

## ✅ Phase 4 exit gate

- [ ] All three hosts register the AutoAdmin packages **unconditionally**; no `Feature.AutoAdmin.V2` reference anywhere.
- [ ] Legacy VPN/moderation/protected-names code **and** the in-host VPN-detected-tags reconcile body deleted; all three hosts net-negative AutoAdmin LOC.
- [ ] `AutoAdminLegacyExclusionConvention` removed; no route collision; policy set + settings round-trip unchanged; tag-reconcile ordering (03:00 → 03:30 → 04:00) preserved.
- [ ] Host's own `ContentSafetyClient` registration removed; the feature owns it via its options builder (fed host config incl. `NewPlayerWindowDays` + `BotAdminId`).
- [ ] `vpnProtection` + `moderation` contracts removed from `Settings.Contracts.V1`; shrunk platform package published; no lingering references.
- [ ] Build/test/format + characterization/Playwright green in all three hosts.
- [ ] `Feature.AutoAdmin.V2` removed from App Config.
- [ ] **SDK tagged `v1.0`** (core frozen; additive-only thereafter).
- [ ] `code-review` sub-agent run per repo; High/Medium findings resolved.

**Outcome:** AutoAdmin (VPN Protection + Chat Moderation + Protected Names) lives entirely in `portal-feature-autoadmin`; the estate continues with the [per-feature migration recipe](../portal-features-spec/feature-catalog.md#per-feature-migration-recipe) for the Chat cluster, Player cluster, Bans, and the long tail.

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

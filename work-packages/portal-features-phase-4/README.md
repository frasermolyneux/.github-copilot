# Phase 4 — Retire the Legacy AutoAdmin Implementation (Executable Plan)

The **execute-it-verbatim** plan for **removing the legacy in-host VPN Protection, Chat Moderation, and Protected Names code and the `Feature.AutoAdmin.V2` flag**, leaving AutoAdmin served **only** from the `portal-feature-autoadmin` packages. Run this **only after** [Phase 3](../portal-features-phase-3/README.md) has validated the side-by-side in **prd**.

> This is the "Remove legacy" step of the flag-gated cutover for AutoAdmin, mirroring [Phase 2](../portal-features-phase-2/README.md) (Maps retirement).

## Preconditions (do not start otherwise)

- `Feature.AutoAdmin.V2` has been **on in prd** and **soaked** with no regressions (Phase 3 exit gate passed).
- Characterization + Playwright parity confirmed with the flag on, including the moderation **`Observation`** (fires after command dispatch, does not block), the **settings round-trip**, and the **VPN-detected-tags reconcile**.
- The `portal-feature-autoadmin` packages are the ones running in prd.

> **Rollback note:** the flag is only an interim rollback lever. **Once a host is made unconditional and its legacy code is deleted, flipping the flag no longer restores legacy for that host** — rollback from that point is a **redeploy** (git revert). Sequence host-by-host so at most one host is mid-migration, validate after each, and remove the flag definition last (4.D).

## Scope — three hosts

`portal-server-events`, `portal-web`, and `portal-repository-func` (the VPN-detected-tags reconcile job) are touched. `portal-repository`, `portal-sync`, and `portal-servers-integration` are untouched.

## What Phase 4 delivers

- Legacy `VpnProtection/*`, `Moderation/*`, and `Services/ProtectedNameService` (+ the in-host **connection guard / protected-name enforcer collaborators** and the **moderation handler**) deleted from `portal-server-events`.
- Legacy `ProtectedNamesController` + views + profile block + the in-host VPN/moderation settings sections/view-models deleted from `portal-web`; the `AutoAdminLegacyExclusionConvention` removed; the packages register **unconditionally**.
- Legacy in-host `ReconcileVpnDetectedTags` body deleted from `portal-repository-func` (the `[TimerTrigger]`/`[HttpTrigger]` stub stays, calling the package job); the package registers **unconditionally**.
- The host's own `ContentSafetyClient` registration removed — the feature owns it (fed `ContentSafety:Endpoint`, `NewPlayerWindowDays`, and `BotAdminId` via its options builder).
- The `vpnProtection` + `moderation` contracts removed from `Settings.Contracts.V1` (coordinated platform-package change; no data migration — wire-compatible format).
- The `Feature.AutoAdmin.V2` flag definition removed from App Configuration.
- All three hosts **net-negative** AutoAdmin LOC; AutoAdmin served solely from packages.
- **The SDK core is frozen at `v1.0`** (deferred from Phase 2) — with AutoAdmin proving the settings, profile-block, reconciliation, tag-substrate, and connection-collaborator planes from a package (and Maps proving the rest), the contracts are tagged and **additive-only** thereafter.

> **SDK freeze happens HERE.** Phases 0–3 kept the SDK at `0.x` (walking skeleton). AutoAdmin is the first feature to exercise the settings, profile-block, reconciliation, tag-substrate, and connection-collaborator planes **from a package** — so once its retire is validated, **tag the SDK `v1.0`** (contracts frozen; additive-only thereafter). See [4.F](retirement-plan.md#4f--freeze-the-sdk-at-v10-only-after-4a4e).

> **`Settings.Contracts.V1`:** **shrinks** — the `vpnProtection` / `moderation` contracts are now feature-owned in `AutoAdmin.Abstractions`, so 4.E deletes the central copies and republishes the **shrunk** package (which still holds other not-yet-migrated namespaces).
>
> **`ContentSafetyClient`:** **moves into the feature** — `AutoAdmin.Processing` registers it from host-supplied config via its options builder; the host stops registering it directly.
>
> **`Players.ProtectedNames.Write`:** may remain in the central `AdditionalPermission.Definitions` (harmless — structural validation is authoritative; `portal-web` surfaces it via `AutoAdminPermissions`). Central-list cleanup is a later cross-feature consolidation, out of scope here.

## Order of operations (critical)

Per host, in this order, validating after each:

1. **Make the package path unconditional** — remove the `if (features.IsEnabled("AutoAdmin.V2"))` guard; in `portal-web` also remove the `AutoAdminLegacyExclusionConvention` (legacy controller is about to be deleted).
2. **Delete the legacy code** for that host.
3. **Validate** (build/test/format + characterization/Playwright).

Only **after all three hosts are clean and validated**:

4. **Remove the `Feature.AutoAdmin.V2` flag** from App Configuration (dev + prd) (4.D).
5. **Remove the central `vpnProtection` / `moderation` contracts** from `Settings.Contracts.V1` and republish the shrunk platform package (4.E).
6. **Freeze the SDK at `v1.0`** — tag the core contracts now that AutoAdmin has proven every plane from a package (4.F).

## Phase 4 definition of done

- No `Feature.AutoAdmin.V2` reference remains in any host; the flag is removed from App Config.
- No legacy VPN/moderation/protected-names code (or the in-host VPN-detected-tags reconcile body) remains; all three hosts net-negative AutoAdmin LOC.
- `AutoAdminLegacyExclusionConvention` removed; no route collision; policy set + settings round-trip unchanged; tag-reconcile ordering preserved.
- Build/test/format + characterization/Playwright green in all three hosts.
- **SDK tagged `v1.0`** (core frozen; additive-only thereafter).
- `code-review` sub-agent run per repo; High/Medium findings resolved.

## Documents

| Doc                                      | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| [retirement-plan.md](retirement-plan.md) | Per-host deletion steps, validation, and flag removal. |

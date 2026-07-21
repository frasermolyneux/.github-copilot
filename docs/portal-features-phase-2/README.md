# Phase 2 — Retire the Legacy Maps Implementation (Executable Plan)

This folder is the **execute-it-verbatim** plan for **removing the legacy in-host maps code and the `Feature.Maps.V2` flag**, leaving Maps served **only** from the `portal-feature-maps` packages. Run this **only after** [Phase 1](../portal-features-phase-1/README.md) has validated the side-by-side in **prd**.

> Design context: [../portal-features-spec/architecture.md](../portal-features-spec/architecture.md). This is the "Remove legacy" step of the flag-gated cutover, done as its own phase.

## Preconditions (do not start otherwise)

- `Feature.Maps.V2` has been **on in prd** and **soaked** with no regressions (Phase 1 exit gate passed).
- Characterization + Playwright parity confirmed with the flag on.
- The `portal-feature-maps` packages are the ones running in prd.

> **Rollback note:** once legacy is deleted, reverting is a **redeploy** (git revert), not a flag flip. Proceed only with prd confidence. Keep the flag as the rollback lever until *all* hosts are made unconditional and validated, then remove it last.

## What Phase 2 delivers

- Legacy maps controllers/views/nav, map-vote commands, map-sync/popularity jobs, and legacy maps permission surfacing are **deleted** from the five hosts.
- The `Feature.Maps.V2` flag branches and the `MapsLegacyExclusionConvention` are removed; the Maps packages register **unconditionally**.
- The `Feature.Maps.V2` flag definition is removed from Azure App Configuration.
- Hosts are **net-negative** maps LOC; Maps is served solely from packages.
- **No SDK freeze here** — the SDK stays at `0.x` and keeps evolving; the `v1.0` freeze is deferred to **Phase 4** (after AutoAdmin proves the settings/profile/reconciliation/connection planes). Maps consumes the latest pre-freeze SDK.

## Order of operations (critical)

Per host, in this order, validating after each host:

1. **Make the package path unconditional** — remove the `if (features.IsEnabled("Maps.V2"))` guard so `AddMapsFeature*()` always registers; remove the `MapsLegacyExclusionConvention` (no longer needed once legacy controllers are gone).
2. **Delete the legacy maps code** — controllers/views/nav/commands/jobs/permission handling for maps.
3. **Validate** the host (build/test/format + characterization/Playwright) with Maps now unconditional.

Only **after all five hosts are clean and validated**:

4. **Remove the `Feature.Maps.V2` flag** definition from App Configuration (dev + prd) — a manual App Config delete (or `portal-environments` cleanup).

Do not delete the flag before every host is unconditional — it is the rollback lever during the transition. **The SDK is not frozen here** (that is Phase 4).

## Phase 2 definition of done

- No `Feature.Maps.V2` reference remains in any host; the flag is removed from App Config.
- No legacy maps controllers/views/nav/commands/jobs remain; hosts are net-negative maps LOC.
- Maps served entirely from `portal-feature-maps`; build/test/format + characterization/Playwright green in all five hosts.
- `code-review` sub-agent run per repo; High/Medium findings resolved.

## Documents

| Doc                                      | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| [retirement-plan.md](retirement-plan.md) | Per-host deletion steps, validation, and flag removal. |

## Next

[Phase 3 — AutoAdmin: Build & Side-by-Side](../portal-features-phase-3/README.md) migrates VPN Protection + Chat Moderation + Protected Names; [Phase 4](../portal-features-phase-4/README.md) retires that legacy.

# Phase 1 — Maps Feature: Build & Side-by-Side (Executable Plan)

This folder is the **execute-it-verbatim** plan for migrating **Maps** into its own repo and running it **side-by-side** with the legacy in-host implementation behind a feature flag. **Legacy is not removed here** — that is [Phase 2](../portal-features-phase-2/README.md), done only after this phase validates the side-by-side.

> Design context: [../portal-features-spec/architecture.md](../portal-features-spec/architecture.md). Prerequisite: **Phase 0 is complete** — the SDK is published and every host runs on the SDK seams ([../portal-features-phase-0/README.md](../portal-features-phase-0/README.md)).

## What Phase 1 delivers

- **Part 1 — build & publish `portal-feature-maps`** ([part-1-feature-build.md](part-1-feature-build.md)): three packages (`.Abstractions`, `.Web`, `.Processing`) containing the maps code moved out of the five hosts. **Gated on NuGet publish.**
- **Part 2 — integrate behind `Feature.Maps.V2`** ([part-2-host-integration.md](part-2-host-integration.md)): the five hosts reference the Maps packages and register them **flag-gated**, running side-by-side with legacy (flag off = legacy, on = feature). Validated by characterization + Playwright in **both** flag states, then enabled dev → prd → soak.

At the end of Phase 1: with `Feature.Maps.V2` **on**, Maps is served entirely from packages; with it **off**, legacy still works. Legacy code still exists (removed in Phase 2).

## Maps footprint (validated against the current code)

| Plane       | Moves into                      | Notes                                                                                                                                                                                                      |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web         | `Features.Maps.Web` (RCL)       | `MapsController`, `MapManagerController`, `MapRotationsController` + views; the maps `ApiControllers` datatable endpoint; `MapPopularityTagHelper`; `MapRotationCfgParser`; a `MapsNavigation` contributor |
| Events      | `Features.Maps.Processing`      | `MapVoteLikeCommand` / `MapVoteDislikeCommand` (SDK `IChatCommand`) **only**                                                                                                                               |
| Jobs        | `Features.Maps.Processing`      | `MapPopularityJob` (repository-func), `MapImageSyncJob` / `MapRedirectSyncJob` / `RedirectToGameServerMapSyncJob` / `MapRotationCleanupJob` (portal-sync)                                                  |
| Permissions | `Features.Maps.Abstractions`    | `MapsPermissions : IPermissionContributor` (`Maps.Read`, `MapRotations.*`, `GameServers.Maps.*`)                                                                                                           |
| Data        | `portal-repository` (unchanged) | Maps/MapRotations tables + API; the feature consumes them via `IRepositoryApiClient`                                                                                                                       |

**Corrections baked in (verified in code):**
- **`MapChange` has no Maps reaction** — `MapChangeProcessor` only persists a `GameServerEvent` + audit. That is **platform core** (Phase 0's `PersistMapChangeHandler`) and **does not move**. Maps ships **no** `IServerEventHandler`.
- **No maps settings namespace** exists in `Settings.Contracts.V1` — map rotations are **data** (Repository API), so Maps ships **no `ISettingsSection`** and no settings contract.
- **Map popularity** is a **tag helper** + the rebuild **job**, not a dashboard widget.
- Map deploy/sync reaches game servers via the **existing** `portal-servers-integration` API (through the SDK `IRconGateway` / the Servers client) — `portal-servers-integration` is **not modified**.

## Locked decisions for this plan

| #   | Decision         | Choice                                                                                                                                                                                                                                                                                                                           |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Feature repo     | New `portal-feature-maps`; packages `XtremeIdiots.Portal.Features.Maps.Abstractions` / `.Web` / `.Processing` (+ `.Testing`).                                                                                                                                                                                                    |
| 2   | Flag             | `Feature.Maps.V2`, default **off**, per environment; **startup-evaluated** (flip + host restart, no redeploy).                                                                                                                                                                                                                   |
| 3   | Web side-by-side | Startup flag + a `MapsLegacyExclusionConvention` that removes the legacy maps controllers from routing when the flag is on (MVC controllers can't coexist at the same routes).                                                                                                                                                   |
| 4   | Permissions      | `MapsPermissions` contributes the maps definitions; when the flag is on, portal-web registers it **and excludes** the maps entries from the legacy in-host permission contributor (avoids duplicate-claim errors). Claim-type strings are unchanged.                                                                             |
| 5   | Legacy removal   | **Not in this phase** — [Phase 2](../portal-features-phase-2/README.md).                                                                                                                                                                                                                                                         |
| 6   | SDK version      | Consume the published SDK `0.x` (latest pre-freeze); do **not** freeze to `v1.0` yet — that is **Phase 4** (after AutoAdmin proves the settings/profile/reconciliation/connection planes). The SDK may still change shape between Maps and AutoAdmin, so Maps consumes the **latest pre-freeze** version (a no-op bump is fine). |

## Golden rules for the executing agent

- No git write ops / no secrets unless the requester asks; follow each repo's `AGENTS.md`.
- **Behaviour must be identical** in both flag states; characterization + Playwright are the oracle.
- Surface the **publish gate**: finish Part 1, publish/review the Maps packages, then start Part 2. No cross-repo project references.
- Build + test + `dotnet format --verify-no-changes` must pass in every touched repo before a step is "done".
- **Exactly one path runs per environment** — when the flag is on, the legacy path must be fully disabled (controllers excluded, commands/jobs/nav/permissions not registered).

## Phase 1 definition of done

- `portal-feature-maps` published to NuGet.org `0.1.x` and restorable.
- Five hosts reference the Maps packages, flag-gated; **flag off = legacy, flag on = feature**, both behaviourally identical (characterization + Playwright).
- `Feature.Maps.V2` enabled in **dev** and **prd** and soaked with no regressions.
- Legacy maps code **still present** and still works when the flag is off.
- `code-review` sub-agent run per repo; High/Medium findings resolved.

## Documents

| Doc                                                      | Purpose                                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [part-1-feature-build.md](part-1-feature-build.md)       | Build & publish `portal-feature-maps` (the three packages), moving maps code out of the hosts.                                     |
| [part-2-host-integration.md](part-2-host-integration.md) | Reference & register the Maps packages in the five hosts behind `Feature.Maps.V2`; validate side-by-side; enable dev → prd → soak. |

# Portal Feature Platform — Specification

The `portal-*` estate is a **feature-plugin platform**. A feature (e.g. *Maps*, *AutoAdmin*, *Chat Commands*) is **self-contained in its own repository** and published as a small set of NuGet packages that the portal hosts **compose at build time**. The hosts are thin composition shells; feature logic lives in feature repos.

This folder is the **specification** — the target architecture, the feature set, and the decisions that govern them. The step-by-step build plans live in the sibling `portal-features-phase-*` folders.

## The three-tier model

Every capability in the estate is exactly one of three tiers:

1. **Data plane** — `portal-repository`, the single system of record behind the Repository API. Features read/write through the typed API client, never SQL directly. Unchanged.
2. **Platform / core** — the canonical write path, the shared capabilities many features depend on (live status, player identity, GeoIP enrichment, permissions aggregation, RCON transport), and all host/SDK runtime plumbing. **Owned by the hosts and the SDK, never by a feature.**
3. **Features** — plugins that **enrich** (derive/add data) or **react** (take action) on top of core, through SDK contracts. Single-domain, self-contained.

Core owns the *canonical* and the *shared*; features own the *specific*. Where a domain has both aspects (e.g. bans: persistence + file-sync enforcement), the canonical write stays core and only the reaction is the feature.

## Documents

| Doc                                      | Purpose                                                                                                                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)       | The target model: extension **planes**, the Feature SDK contracts (settings, server-events pipeline, jobs, web, permissions, game), UI-testing ownership, the shared context + cache, packaging, DI discovery, cutover mechanism, and versioning. |
| [feature-catalog.md](feature-catalog.md) | The **feature set**: platform-core vs feature boundary, the feature modules and their packages, reconciliation ownership, game scope, permissions ownership, and the migration order.                                       |
| [decisions.md](decisions.md)             | The **locked decisions** that govern the platform, the deferred governance step, and the success criteria.                                                                                                                  |

## Delivery phases

Execution is sequenced in the sibling folders. Each feature migration is a **build/side-by-side** phase followed by a **retire** phase, both gated by `Microsoft.FeatureManagement`.

| Phase folder                                                        | Delivers                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [../portal-features-phase-0/](../portal-features-phase-0/README.md) | Build & publish the Feature SDK, then integrate it into the five hosts (host seams, no behaviour change).                                                           |
| [../portal-features-phase-1/](../portal-features-phase-1/README.md) | Build `portal-feature-maps` and run it side-by-side behind `Feature.Maps.V2`.                                                                                       |
| [../portal-features-phase-2/](../portal-features-phase-2/README.md) | Retire the legacy maps implementation.                                                                                                                              |
| [../portal-features-phase-3/](../portal-features-phase-3/README.md) | Build `portal-feature-autoadmin` (VPN Protection + Chat Moderation + Protected Names) side-by-side behind `Feature.AutoAdmin.V2`.                                   |
| [../portal-features-phase-4/](../portal-features-phase-4/README.md) | Retire the legacy AutoAdmin implementation, remove the `vpnProtection`/`moderation` namespaces from `Settings.Contracts.V1`, and **freeze the SDK core at `v1.0`**. |

Subsequent features (Chat cluster, Player cluster, Bans, and the long tail) follow the same build/retire recipe using the frozen SDK — see the [migration order](feature-catalog.md#migration-order).

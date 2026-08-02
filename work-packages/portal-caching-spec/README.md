# Portal Caching — Specification

The `portal-*` estate uses a consistent, multi-tier caching system to reduce redundant calls and improve latency and UX at minimal cost. This folder is the **specification** (architecture, functionality, decisions). Execution is in the sibling phase folders.

## Documents

| Doc                                | Purpose                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [spec.md](spec.md)                 | Architecture, tiers, policy model, tier-selection & batching rules, server-side behaviour, invalidation rules, and L2 data structures. |
| [flow-changes.md](flow-changes.md) | Per-API functional changes (FC-1…FC-9) and the phase each lands in.                                                                    |

## Locked decisions

| Decision              | Choice                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library               | Own `dotnet-caching` repo; packages `MX.Caching`, `MX.Caching.Abstractions`, `MX.Caching.TableStorage`, `MX.Caching.Testing`.                                                           |
| Primitive             | .NET 9 `HybridCache` (L1+L2 read-through, stampede protection, serialization, tag invalidation).                                                                                        |
| Facade                | Thin `MX.Caching` facade adding the policy model + transparent client decorator.                                                                                                        |
| L2 backend            | Azure **Table Storage** on **one shared cache storage account** provisioned in `portal-core`.                                                                                           |
| Live status/players   | LiveStatus (status + players) stored on the shared cache account.                                                                                                                       |
| Backend selection     | Config-driven (`MxCaching:Backend`); the library defaults to `Memory`, while shared L2 caching explicitly selects `TableStorage`.                                                      |
| Metrics               | `System.Diagnostics.Metrics.Meter` (vendor-neutral).                                                                                                                                    |
| Kill-switch           | Config (`Backend=Memory`, per-policy `Enabled=false`, TTL=0); no feature flag.                                                                                                          |
| Server cache-aside    | Service/repository decorator; tag eviction is the authoritative cross-instance path (Table side-index if the Phase 0 spike requires it).                                                |
| Serialization         | HybridCache uses a **Newtonsoft.Json** `IHybridCacheSerializer` matching the clients' JSON settings (DTOs have `internal set` + Newtonsoft attributes; STJ would not round-trip them).  |
| Shared-account access | Only the **Repository API host** accesses the shared cache account directly; all other consumers are **L1-only** (`portal-server-events` writes LiveStatus through the Repository API). |
| Live-view staleness   | `acceptableStaleness` default **60s**; a force-refresh passes **0**.                                                                                                                    |
| ConnectedPlayers      | The existing paged `GetConnectedPlayers` endpoint is **extended with server-side search/sort**; `portal-web` pages/filters server-side (no full-table client cache).                    |
| Client scope          | Only the **Repository** and **Servers Integration** API clients ship default policies. TFMs `net9.0;net10.0`.                                                                           |
| Not used              | Cosmos, Redis, edge/APIM caching.                                                                                                                                                       |
| Player-id caching     | **Unchanged** — existing per-instance ~15-min L1 in the events processors; **not** promoted to shared L2 (cached `{PlayerId,Tags}` carries mutable authorization Tags).                 |
| Not cached            | GeoLocation (owned by `geo-location`); user claims/permissions (L1-only); static enums.                                                                                                 |

## Rollout phases

| Phase        | Scope                                                                                                                                                                  | Folder                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 0            | `dotnet-caching` repo + `MX.Caching*` packages.                                                                                                                        | [portal-caching-phase-0/](../portal-caching-phase-0/README.md) |
| 1            | Client caching capability (`.WithCaching(...)` decorator + policy model in `MX.Api.Client`).                                                                           | [portal-caching-phase-1/](../portal-caching-phase-1/README.md) |
| 2            | Repository API caching: shared cache account + LiveStatus move + extended connected-players endpoint + default policies + server cache-aside; roll out to 6 consumers. | [portal-caching-phase-2/](../portal-caching-phase-2/README.md) |
| 3            | Servers Integration API caching: live-players read-through + FTP listing + default policies; roll out to 3 consumers.                                                  | [portal-caching-phase-3/](../portal-caching-phase-3/README.md) |
| 4 (optional) | Cosmos backend + Service Bus `cache-invalidation` topic — only if a concrete need arises.                                                                              | —                                                              |

Infra: Phases 0–1 add no Azure resources; Phase 2 provisions the single shared cache storage account (`portal-core`, ~<$1/mo) reused by Phase 3.

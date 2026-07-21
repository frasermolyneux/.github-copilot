# Phase 2 · Part 1 — Implement Caching in the Repository API

Ship default cache policies in the Repository **client packages** and add **server-side cache-aside + tag eviction** in the Repository API host. **Gated on NuGet publish** — consumer parts adopt the published `Api.Client.V1/V2`.

> Prerequisite: Phase 1 published ([portal-caching-phase-1/](../portal-caching-phase-1/README.md)). Repos: `portal-core` (shared cache account) + `portal-repository`.

## 1.0 — Provision the shared cache account + move LiveStatus (`portal-core` + `portal-repository`)
- **Do (`portal-core`):** Provision **one shared cache storage account** (Terraform) and expose its Table endpoint as an output. Grant **`Storage Table Data Contributor`** to the **Repository API** managed identity (the only service that touches the shared account directly) via a role assignment referencing that identity from remote state.
- **Do (`portal-repository`):** Repoint the existing `ILiveStatusStore` (`TableStorageLiveStatusStore`) `TableServiceClient` at the **shared cache account** so LiveStatus (status + players) lives there. Data is ephemeral (agent-refreshed ~60s) — **no migration**. Wire `AddMxCaching(config)` (`Backend=TableStorage`, endpoint = shared account).
- **Acceptance:** `terraform plan` shows the account + role assignments; LiveStatus reads/writes go to the shared account; managed identity auth (no keys).
- **Validate:** `terraform -chdir=terraform fmt -check -recursive` + `validate` + `plan -var-file=tfvars/dev.tfvars` in `portal-core`.

## 1.A — Default cache policies in `Api.Client.V1/V2`
- **Do:** In each client package's DI extension (`AddRepositoryApiClient*`), register **library default policies** via `AddDefaultCachePolicies<IRepositoryApiClient>(defaults => ...)` (the Phase 1 mechanism) so consumers inherit them with `UseLibraryDefaults()`:
  - `InMemory<IGameServersApi>(x => x.GetGameServer, ttl: 60s)` with tag `gameserver:{id}`.
  - `InMemory<IGameServersApi>(x => x.GetGameServers, ttl: 60s)`. **`IMapsApi.GetMap` is overloaded** — register **both** overloads (`GetMap(Guid)` and `GetMap(GameType, string)`) at `ttl: 10m` via invocation expressions, plus `GetMaps`.
  - `NotCached` for all mutating endpoints and anything auth-scoped (user profile/claims).
- **Acceptance:** consumers that call `UseLibraryDefaults()` get these automatically; unit tests assert the default set.

## 1.B — Server-side cache-aside (FC-6 `GetGameServer`)
- **Do:** In the Repository API host, add a **service/repository decorator** (not controller-level, per the chosen architecture) that wraps the `GetGameServer(id)` read path with `IMxCache` keyed `gameserver:{id}`, tag `gameserver:{id}`, backed by the **shared cache account**; **evict the tag** in the create/update/delete handlers. Metrics via `System.Diagnostics.Metrics.Meter`.
- **Acceptance:** repeated `GetGameServer` hits the cache; an update evicts across instances (per the Phase 0 tag-eviction outcome — side-index if the spike required it).

## 1.C — Server-side cache-aside (FC-8 dashboard aggregations)
- **Do:** Cache `GetDashboardSummary`, `GetAdminLeaderboard(30)`, `GetModerationTrend(30)`, `GetServerUtilization` with a 60–120s TTL, keyed `dashboard:{metric}:{window}`.
- **Acceptance:** dashboard load issues at most one heavy aggregation per metric per window.

## 1.D — Server-side cache-aside (FC-9 per-server settings resolution)
- **Do:** Cache the **resolved** settings document keyed `settings:{gameServerId}:{namespace}` (and `settings:global:{namespace}`), 5–10 min TTL; **evict the tag** on `UpsertConfiguration` (server+namespace; a global-namespace write evicts every server's entry for that namespace).
- **Acceptance:** resolution is served from cache between edits; an edit evicts precisely.

## 1.E — Never-cache guards
- **Do:** Ensure `/v{n}/info` and `/health/*` return `no-store`; keep user-profile/claims endpoints out of any shared response cache.
- **Acceptance:** deploy version-verification still reads the exact build version (uncached).

## 1.F — Extend connected-players endpoint with search/sort (Q7)
- **Do:** `GetConnectedPlayers(playerId?, userProfileId?, gameType?, isActive?, skip, take, ct)` **already supports paging + filters**. Add **server-side search + sort** parameters (matching the portal-web DataTable columns) so consumers page/filter/sort server-side. This is a **published contract change** — it ships behind this phase's NuGet gate.
- **Acceptance:** the endpoint supports skip/take + filter + search + sort; `portal-web` can drop its full-dataset fetch+cache (Part 2).

## 1.G — Tests, publish gate
- **Do:** Unit tests for cache-aside + tag eviction (in-memory backend); `dotnet build` / `dotnet test` / `dotnet format --verify-no-changes` green. Cut new `Api.Client.V1/V2` releases to NuGet.org.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Repository.sln
  dotnet test src/XtremeIdiots.Portal.Repository.sln --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Repository.sln --verify-no-changes
  ```
- **Gate:** A scratch consumer restores the new `Api.Client.V1/V2` and sees the default policies. **Only then** start Parts 2–7.

## Part 1 exit gate
- Shared cache account provisioned (`portal-core`) with RBAC; **LiveStatus moved onto it**.
- New `Api.Client.V1/V2` published with default policies **and the extended connected-players endpoint (server-side search/sort)**.
- Server-side cache-aside (service/repository decorator) + tag eviction live for `GetGameServer`, dashboards, settings; guards in place; metrics via `Meter`.

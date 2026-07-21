# Phase 2 · Part 2 — Roll out to `portal-web`

Adopt the Phase 2 Repository client (with default policies) in `portal-web` and retire its ad-hoc caches. Biggest consumer of the Repository API.

> Prerequisite: [Phase 2 Part 1](part-1-repository-api.md) published. Read [docs/ui-standards-guide.md](../../../portal-web/docs/ui-standards-guide.md) for any view touch.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Repository.Api.Client.V1/V2` to the Part 1 version; opt into defaults with `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`. `GetGameServer`/maps reference reads are now L1 cached automatically.
- **Do — FC-7 batch (game servers):** In `MapRotationsController`, replace the per-assignment `GetGameServer(assignment.GameServerId)` loops with a single `GetGameServers(null, ids, null, 0, N, null)` call, then look up per item from the result. **Maps stay per-item:** the `GetMap(rotationMap.MapId)` loops have **no batch-by-id** endpoint — they resolve from the client `GetMap` L1 default policy (repeated ids become cache hits); do **not** attempt `GetMaps(names[])` (you have ids, not names).
- **Do — retire ad-hoc caches:** Remove the hand-rolled `IMemoryCache` blocks in `MapRotationsController`, `ServerAdminController`, `BannersController`; express any still-needed caching via consumer `.Override/.Add`. Replace `ConnectedPlayersController`'s full-dataset 30s cache by adopting the **extended `GetConnectedPlayers`** (server-side search/sort from Part 1, Q7): switch `connected-players-index.js` to DataTables **`serverSide: true`** and pass DataTables' `draw/start/length/search[value]/order` from `GetConnectedPlayersAjax` through to the extended API (see [docs/DATATABLE-IMPLEMENTATION-GUIDE.md](../../../portal-web/docs/DATATABLE-IMPLEMENTATION-GUIDE.md)). Today it fetches `0,500` and pages client-side; do **not** fetch or cache all rows client-side.
- **Do — intra-request de-dupe:** Repeated `GetGameServer(id)` calls within a single `ServerAdminController` request coalesce automatically via L1 + stampede protection — no request-scoped tier needed; prefer batching for N+1 loops.
- **Do — leave uncached:** user profile/claims and any auth-gated reads.
- **Acceptance:** pages render identically; App Insights shows fewer Repository `GetGameServer`/`GetMap` calls per request; no ad-hoc `IMemoryCache` remains for Repository reference reads.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Web/XtremeIdiots.Portal.Web.csproj
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Web.sln --verify-no-changes
  ```

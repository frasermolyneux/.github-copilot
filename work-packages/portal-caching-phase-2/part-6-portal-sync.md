# Phase 2 · Part 6 — Roll out to `portal-sync`

Adopt the Phase 2 Repository client defaults in the sync jobs.

> Prerequisite: [Phase 2 Part 1](part-1-repository-api.md) published.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Repository.Api.Client.V1`; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`. Reference reads (`GetGameServers`, maps) are now cached.
- **Do — FC-7 (maps rely on L1, no batch-by-id):** `MapRotationActivities.ResolveMapNames` resolves map **ids → names** via `GetMap(rotationMap.MapId)`; there is **no batch-by-id** endpoint, so it can't use `GetMaps(names[])`. Rely on the client `GetMap` L1 default policy (repeated ids become cache hits within the job) — no code change beyond adopting defaults.
- **Do — jobs stay wrapped:** keep `IJobTelemetry.ExecuteAsync()` around each scheduled job.
- **Acceptance:** repeated `GetMap(id)` calls in a run hit L1; fewer Repository calls per run.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Sync.App.sln
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Sync.App.sln --verify-no-changes
  ```

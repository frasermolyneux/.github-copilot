# Phase 3 · Part 3 — Roll out to `portal-sync`

Adopt the Phase 3 Servers client in the map-sync jobs.

> Prerequisite: [Phase 3 Part 1](part-1-servers-integration-api.md) published.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Integrations.Servers.Api.Client.V1` to the Part 1 version; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`.
- **Do — map sync:** Read-shaped Servers API calls in the map/redirect sync jobs use the cached defaults; keep FTP/map **writes** uncached.
- **Do — jobs stay wrapped:** keep `IJobTelemetry.ExecuteAsync()` around each job.
- **Acceptance:** sync runs issue fewer redundant Servers API reads; write paths unaffected.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Sync.App.sln
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Sync.App.sln --verify-no-changes
  ```

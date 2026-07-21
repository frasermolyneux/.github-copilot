# Phase 2 · Part 3 — Roll out to `portal-servers-integration`

Adopt the Phase 2 Repository client so `QueryController` (and other controllers) stop re-fetching `GetGameServer(id)` on every request.

> Prerequisite: [Phase 2 Part 1](part-1-repository-api.md) published.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Repository.Api.Client.V1` to the Part 1 version; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`. `GetGameServer` is now cached (L1 + tag), so the per-request lookup in `QueryController.GetServerStatus` and the RCON/map controllers is served from cache between edits.
- **Do — remove redundancy:** Drop any local re-fetch or bespoke `IMemoryCache` of game-server metadata now covered by the client policy. (The live **query status** cache is handled in Phase 3, not here.)
- **Acceptance:** repeated queries for the same server issue one Repository `GetGameServer` per TTL window, not per request.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Integrations.Servers.sln
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Integrations.Servers.sln --verify-no-changes
  ```

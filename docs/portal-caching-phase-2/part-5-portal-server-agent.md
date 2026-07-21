# Phase 2 · Part 5 — Roll out to `portal-server-agent`

Adopt the Phase 2 Repository client. The agent benefits automatically from the **server-side settings cache** (FC-9) added in Part 1, and from cached `GetGameServers` reference reads.

> Prerequisite: [Phase 2 Part 1](part-1-repository-api.md) published.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Repository.Api.Client.V1`; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`.
- **Do — settings:** `RepositoryServerConfigProvider` and the reconciliation services call `GlobalConfigurations`/`GameServerConfigurations` `GetConfiguration` — these are now served from the Repository API's server-side settings cache-aside (Part 1 FC-9). Remove any redundant per-cycle re-fetch that a short client override can cover; **do not** add a second bespoke cache.
- **Do — leave FTP/RCON alone:** direct game-server transport is unchanged; only Repository reads are affected here.
- **Acceptance:** agent cycles issue fewer `GetConfiguration`/`GetGameServers` calls; settings changes still take effect within the resolution TTL / on tag eviction.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Server.Agent.slnx
  dotnet test src/XtremeIdiots.Portal.Server.Agent.slnx --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Server.Agent.slnx --verify-no-changes
  ```

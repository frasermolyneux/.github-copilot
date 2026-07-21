# Phase 3 · Part 4 — Roll out to `portal-server-agent`

Adopt the Phase 3 Servers client for any Servers API reads the agent performs.

> Prerequisite: [Phase 3 Part 1](part-1-servers-integration-api.md) published.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Integrations.Servers.Api.Client.V1` to the Part 1 version; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`.
- **Do — RCON stays uncached:** The agent's Servers API usage is **predominantly RCON** (`RconBroadcastService`, `Cod4xCvarProbe`, `CoD4xPluginLifecycleService`), which the default policies mark `NotCached` — so this is mainly a version bump that keeps RCON live. Any read-shaped Servers API calls (e.g. in `ServerSyncService`) pick up the cached defaults.
- **Do — leave transport alone:** the agent's direct FTP/RCON transport to game servers is unchanged and uncached.
- **Acceptance:** RCON operations still hit live; any read-shaped Servers API calls are cached; agent behaviour unchanged.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Server.Agent.slnx
  dotnet test src/XtremeIdiots.Portal.Server.Agent.slnx --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Server.Agent.slnx --verify-no-changes
  ```

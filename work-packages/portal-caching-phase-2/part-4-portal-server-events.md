# Phase 2 · Part 4 — Roll out to `portal-server-events`

Adopt the Phase 2 Repository client defaults in the event processors. **No player-id L2 cache** — see the note below.

> Prerequisite: [Phase 2 Part 1](part-1-repository-api.md) published.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Repository.Api.Client.V1`; `.WithCaching(c => c.UseLibraryDefaults())`. Reference reads in the processors (`GetGameServer`, etc.) are now L1-cached via the client defaults.
- **Do NOT add a shared player-id L2 (FC-4 dropped):** the processors' player-context helper (`ChatMessageProcessor`, `PlayerConnectedProcessor`, `PlayerIpResolvedProcessor`, `ServerStatusProcessor`) caches `{ PlayerId, Tags }` from `GetPlayerByGameType(..., PlayerEntityOptions.Tags)`. **Tags are mutable authorization data** (forum sync / manual edits) that a shared long-TTL L2 would serve stale. **Leave the existing per-instance ~15-min `IMemoryCache` unchanged.**
- **Do — leave live state alone:** the LiveStatus write path is unchanged (`ServerStatusProcessor` writes it via the Repository `LiveStatus.V1` API).
- **Acceptance:** processors adopt the client defaults; the per-instance player cache and LiveStatus write path are unchanged; build/test/format green.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Server.Events.slnx
  dotnet test src/XtremeIdiots.Portal.Server.Events.slnx --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Server.Events.slnx --verify-no-changes
  ```

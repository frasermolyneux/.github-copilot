# Phase 3 · Part 2 — Roll out to `portal-web`

Adopt the Phase 3 Servers client so the admin live-view prefers the staleness-gated status and only pays for a live RCON/UDP query when the data is genuinely stale.

> Prerequisite: [Phase 3 Part 1](part-1-servers-integration-api.md) published. Read [docs/ui-standards-guide.md](../../../portal-web/docs/ui-standards-guide.md) for any view touch.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Integrations.Servers.Api.Client.V1` to the Part 1 version; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`.
- **Do — live-view:** `ServerAdminController.GetServerStatus` / `AgentTelemetryService` now call the staleness-gated endpoint with an acceptable-staleness argument (**default 60s**; a **force-refresh passes 0**). The direct RCON path fires only on a stale miss.
- **Do — dedupe:** keep RCON moderation actions uncached (they must always hit live).
- **Acceptance:** the server-detail live view renders from LiveStatus when fresh; live queries drop measurably; RCON actions unaffected.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Web/XtremeIdiots.Portal.Web.csproj
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Web.sln --verify-no-changes
  ```

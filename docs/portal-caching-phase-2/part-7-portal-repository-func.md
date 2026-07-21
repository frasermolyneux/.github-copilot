# Phase 2 · Part 7 — Roll out to `portal-repository-func`

Smallest consumer. Adopt the Phase 2 Repository client so scheduled-maintenance reference reads use the shared cache.

> Prerequisite: [Phase 2 Part 1](part-1-repository-api.md) published. Scope rules: this repo owns **scheduled maintenance only** — do not add FTP/RCON/Service Bus/GeoLocation dependencies.

## Steps

- **Do — adopt:** Bump `XtremeIdiots.Portal.Repository.Api.Client.V1`; `.WithCaching(c => c.UseLibraryDefaults())` in `Program.cs`.
- **Do — minimal overrides:** Maintenance timers are mostly writes/prunes; only reference reads (e.g. game-server lookups in `MapPopularity`) benefit. Apply a short `Override` only if a job re-reads the same entity in a tight loop; otherwise defaults suffice.
- **Do — pattern intact:** keep each timer's paired manual HTTP trigger and start/finish logging; use `.ConfigureAwait(false)`.
- **Acceptance:** builds/tests/format green; no new external dependencies; fewer repeated reference reads in maintenance runs.
- **Validate:**
  ```pwsh
  cd src/XtremeIdiots.Portal.Repository.App
  dotnet build
  cd ../..
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src --verify-no-changes
  ```

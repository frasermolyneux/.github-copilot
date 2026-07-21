# Phase 3 · Part 1 — Implement Caching in the Servers Integration API

Ship default cache policies in the Servers **client package** and add the API's server-side caching (FC-1 live-players read-through, FC-5 FTP listing). **Gated on NuGet publish** — consumer parts adopt the published client.

> Prerequisite: Phase 1 published ([portal-caching-phase-1/](../portal-caching-phase-1/README.md)). Repo: `portal-servers-integration`. **No direct shared-account access is required** — FTP listing is L1 (per-instance) and LiveStatus is read/written via the Repository API client (`LiveStatus.V1`).

## 1.A — Default cache policies in the Servers `Api.Client`
- **Do:** Add `.WithCaching(defaults => ...)`:
  - Short-TTL **`InMemory`** (L1) policy for read-shaped status/query endpoints (e.g. 30s), tag `serverstatus:{gameServerId}`. **L1, not Distributed** — so consumers need no shared-account access.
  - `NotCached` for **all** RCON, map-write, and moderation endpoints.
- **Acceptance:** consumers calling `UseLibraryDefaults()` cache reads only (L1); RCON is never cached; unit tests assert the set.

## 1.B — FC-1 live-players staleness-gated read-through (`QueryController`)
- **Contract change (publish in this client):** add a staleness/force-refresh parameter to `IQueryApi.GetServerStatus` (e.g. `int? acceptableStalenessSeconds = null`, where `0` forces a live query and `null` uses the 60s default) across `Abstractions.V1`, the generated client, the controller, and all callers. `QueryController` also takes a **new dependency** on the Repository `ILiveStatusApi` (via `IRepositoryApiClient`).
- **Do:** Change `GetServerStatus` to read LiveStatus via `repositoryApiClient.LiveStatus.V1.GetGameServerLiveStatus/LivePlayers` and check `LastUpdated`; if `age < acceptableStaleness` (**default 60s**; **force-refresh = 0**) map and return the stored snapshot; else issue the live RCON/UDP query and return it. **Do not write the query result back to LiveStatus** (it would clobber the agent-enriched playerId/geo data). A short **per-instance L1** (no shared account) may coalesce repeated stale-misses. Remove the per-instance 300s `IMemoryCache`.
- **Acceptance:** a fresh LiveStatus serves without a live query; a stale one triggers exactly one live query; LiveStatus is never overwritten by a query; callers pass force-refresh only for an explicit refresh.

## 1.C — FC-5 FTP directory listing (L1) (`FileBrowseController`)
- **Do:** Standardise the existing per-instance 30s `IMemoryCache` via the policy model as **L1** (per-instance), keyed `ftp:{gameServerId}:{sha256(path)}`, 30s TTL; **invalidate** the entry on upload/delete of that path. This is a low-frequency admin op — per-instance L1 suffices; no shared-account dependency.
- **Acceptance:** repeat browses within 30s hit L1; a write invalidates the listing.

## 1.D — Wire `MX.Caching`
- **Do:** `AddMxCaching(config)` for the client decorator + L1. **No direct shared-account access** is required. Metrics via `System.Diagnostics.Metrics.Meter` (register the meter with the host observability). Keep telemetry around RCON/query/FTP calls; moderation still emits `IAuditLogger`.
- **Acceptance:** cache hit/miss appear in metrics; no shared-account role assignment needed; no secrets introduced.

## 1.E — Tests, publish gate
- **Do:** Unit tests for the staleness gate (fresh vs stale, no LiveStatus write-back), FTP L1 invalidate-on-write, and the default policy set (RCON not cached). Green build/test/format. Publish the new Servers `Api.Client`.
- **Validate:**
  ```pwsh
  dotnet build src/XtremeIdiots.Portal.Integrations.Servers.sln
  dotnet test src --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/XtremeIdiots.Portal.Integrations.Servers.sln --verify-no-changes
  ```
- **Gate:** A scratch consumer restores the new client and sees the default policies + staleness-gated status. **Only then** start Parts 2–4.

## Part 1 exit gate
- New Servers `Api.Client` published with default policies (L1 reads; RCON `NotCached`).
- Live-players read-through (no LiveStatus clobber) + FTP L1 standardised; per-instance 300s `IMemoryCache` retired.

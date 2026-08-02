# Portal Caching — Architecture & Rules

Specification of the caching architecture, policy model, rules, server-side behaviour, invalidation, and L2 data structures for the `portal-*` estate. Per-API functional changes are in [flow-changes.md](flow-changes.md).

## Cache tiers

| Tier                      | Store                                                           | Sharing                  | Use                                                                                                                              |
| ------------------------- | --------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **L1** In-process         | `IMemoryCache` (via HybridCache)                                | per instance             | Cheap, small, stable reference reads. HybridCache stampede protection also de-dupes concurrent identical reads within a request. |
| **L2** Distributed        | Azure Table Storage on the shared cache account (`portal-core`) | cross instance + service | Expensive origins, cross-service coordination, scale-to-zero cold starts                                                         |
| **Event-populated store** | LiveStatus (Table, shared cache account)                        | cross service            | Producer-owned live state, read staleness-gated                                                                                  |

Intra-request de-dupe is provided by L1 + stampede protection; there is **no separate request-scoped (L0) tier** to implement. Only the **Repository API host** accesses the shared cache account directly (server cache-aside + LiveStatus); all other consumers use **L1 only** and need no shared-account access (`portal-server-events` writes LiveStatus **through** the Repository API).

## MX.Caching facade over HybridCache

Caching is provided by the `MX.Caching` packages (repo: `dotnet-caching`) — a thin facade over .NET 9 `HybridCache`.

- HybridCache provides **L1 + L2 read-through, stampede protection (single-flight), serialization, and tag-based invalidation**. The facade does not reimplement these.
- The facade adds exactly two things: (1) the **declarative defaults-plus-overrides policy model**; (2) a **transparent decorator** over the typed API interfaces (`IGameServersApi`, `IQueryApi`, …) so caching applies with no call-site change.
- The library defaults to the in-memory backend. The L2 backend is **Azure Table Storage** (`IDistributedCache`) when selected explicitly by configuration (`MxCaching:Backend=TableStorage`); every L2-using service points at **one shared cache storage account** provisioned in `portal-core`.
- Metrics are emitted via `System.Diagnostics.Metrics.Meter` (vendor-neutral); each host's existing observability collects them.
- The **kill-switch is config**: `Backend=Memory`, per-policy `Enabled=false`, or TTL=0 turns caching off per environment with no redeploy.
- **Server-side cache-aside uses the same facade** via a service/repository decorator, so keys, tags, and metrics match the client tier.
- **Serialization:** HybridCache is configured with a **Newtonsoft.Json-based `IHybridCacheSerializer`** matching the API clients' existing JSON settings. The DTOs use `internal set` accessors and Newtonsoft `[JsonProperty]`; the default System.Text.Json serializer would **not** round-trip them (L2 would return DTOs with empty/default properties).
- **Interception point:** the client decorator wraps the typed feature-API interfaces (e.g. `IGameServersApi`, exposed by the aggregate client as `client.Feature.V1`), which are DI-registered via `AddTypedApiClient`. The fallback (only if a specific interface proves non-decoratable) is the DI-registered `IRestClientService` (the HTTP executor `BaseApi` calls inside its retry policy), **not** `BaseApi.ExecuteAsync` (a non-virtual method). The Newtonsoft serializer applies either way.
- **Metrics registration:** each host registers the `MX.Caching` `Meter` name with its observability pipeline (App Insights / OpenTelemetry) so hit/miss/eviction are collected.

```jsonc
// appsettings.json — all L2-using services point at the shared cache account
"MxCaching": {
  "Backend": "TableStorage",
  "TableStorage": { "Endpoint": "https://<shared-cache-account>.table.core.windows.net" }
}
```

Cross-instance tag eviction over the Table `IDistributedCache` is verified in Phase 0. If it does not propagate, `MX.Caching.TableStorage` provides a **tag side-index**; short-TTL-only is the fallback if the side-index proves heavy.

## Library defaults + consumer overrides

- Each client package registers **default cache policies** in its `AddXxxApiClient(...)` via `AddDefaultCachePolicies<TClient>(...)`. Only the **Repository** and **Servers Integration** clients ship defaults.
- Consumers apply `.WithCaching(c => c.UseLibraryDefaults() …)` and may `Override`, `Add`, `Disable`, or `WithoutLibraryDefaults()`.
- **Precedence:** `config → consumer Override/Add/Disable → library NotCached → library default → uncached`.
- A `NotCached` policy is only overridable by an explicit `Override`.
- Only successful (`2xx` / `NotFound`) results are cached; errors are never cached. Cache keys = client + method + normalised args + API-version prefix.
- TTLs are config-bindable per environment.

## Tier-selection rules

Applied in order per call site:

1. Value read multiple times within one request → **L1** (HybridCache in-process + stampede protection de-dupe; no separate request-scoped tier).
2. Cheap origin, small stable value, brief staleness acceptable → **L1** (short TTL).
3. Expensive origin, cross-service coordination, central invalidation, large working set, or scale-to-zero cold starts → **L2**.
4. Live state a producer already publishes → read the **event store** staleness-gated; never re-derive per consumer.
5. High-cardinality and cross-instance → **L1 + L2** tiered read-through.

## Batch before cache

For a known set of entities needed within one request or job, prefer a **batch** call over per-item single-item calls where a batch endpoint exists — `GetGameServers(gameServerIds)` for game servers, `GetMaps(mapNames)` for maps **when names are in hand**. There is **no batch-by-id for maps**; loops that resolve `GetMap(mapId)` (portal-web `MapRotationsController`, portal-sync `ResolveMapNames`) rely on the client `GetMap` L1 default policy to de-dupe repeated ids. Caching is for cross-request / cross-consumer reuse.

## Server-side caching (API tier)

| Layer                 | Use                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Client L1/L2**      | Per-consumer latency + offload                                                                                               |
| **Server-side (API)** | Protect the shared SQL origin for all consumers; authoritative write-path/tag invalidation; cache expensive computed results |
| **Edge / APIM**       | Not used — APIM Consumption tier has no built-in cache                                                                       |
| **HTTP ETag / 304**   | Optional bandwidth reduction                                                                                                 |

Rules:

- Server-side cache-aside is a **service/repository decorator**, not controller-level.
- **Auth-scoped** responses (user profile / claims) are cached as data behind the repository, never as a shared HTTP response.
- `/info` and `/health/*` are **`no-store`** (deploy verification and health must be live).
- Concurrent misses use **single-flight** to protect the origin.
- Cross-instance invalidation uses **server-side tag eviction** (authoritative).

## Cache invalidation rules

Time-based expiry is the default; explicit invalidation is used where staleness is user-visible or correctness-sensitive.

### Rule matrix

| Data class                             | Client tier       | Server tier                                           | Invalidation                                                                              | TTL                                                                                  | Notes                                                                           |
| -------------------------------------- | ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Game server metadata (`GetGameServer`) | L1                | Cache-aside + tag eviction                            | Tag eviction on `PUT/PATCH/DELETE`; client TTL backstop                                   | 60s                                                                                  | Server tag eviction is authoritative                                            |
| Game types / static reference lists    | L1                | Optional                                              | TTL only                                                                                  | 5–15 min                                                                             | Effectively immutable between deploys                                           |
| Maps / map rotations                   | L1                | Optional + tag eviction on rotation write             | TTL; invalidate on rotation mutation                                                      | 2–5 min                                                                              | Rebuilt by map timers                                                           |
| Maps (`GetMap`/`GetMaps`)              | L1                | Optional                                              | TTL; invalidate on map edit                                                               | 5–15 min                                                                             | Near-immutable; prefer batch in loops                                           |
| Dashboard aggregations                 | L1 (short)        | Cache-aside                                           | TTL only                                                                                  | 60–120s                                                                              | Heaviest SQL; slow-moving windows                                               |
| User profile / claims                  | L1                | Not shared-cached                                     | Invalidate on `UserProfileForumsSync` claim change; TTL backstop                          | 5 min                                                                                | Auth-sensitive                                                                  |
| Live server status / players           | Event store       | Event store (LiveStatus, shared account)              | Producer refresh (~60s) + staleness gate on read                                          | serve if `age < acceptableStaleness` (default 60s; force-refresh 0), else live-query | Consumers never write it                                                        |
| Server query (RCON/UDP fallback)       | L1 (per-instance) | Reads LiveStatus (via Repository API) staleness-gated | staleness gate; short L1 on live-query miss                                               | 30–60s L1                                                                            | `QueryController`; replaces the 300s cache; no shared-account access            |
| GeoIP / IP intelligence                | —                 | geo-location owns it                                  | TTL (existing)                                                                            | per geo-location                                                                     | Consumers do not re-cache                                                       |
| FTP directory / file browse            | L1 (per-instance) | —                                                     | TTL + invalidate on upload/delete                                                         | 30s                                                                                  | Low-frequency admin op; per-instance L1 suffices (no shared-account dependency) |
| Per-server settings resolution         | L1 (short)        | L2 cache-aside + tag eviction                         | Tag eviction on `UpsertConfiguration` (server+namespace; global write evicts all servers) | 5–10 min backstop                                                                    | Read by agent/servers-integration/web/events; changes on admin edit             |
| Health / `info` endpoints              | —                 | `no-store`                                            | never cache                                                                               | none                                                                                 | Deploy gate polls exact build version                                           |

### Invalidation mechanisms

1. **Time-based (TTL).** Default; self-healing.
2. **Write-through (same process).** A mutating client call evicts the affected keys for that entity in the calling process.
3. **Server-side tag eviction (authoritative).** A mutation handler evicts the entity's tag from the shared store, reaching all API instances.
4. **Producer refresh + staleness gate.** Live state is overwritten by the producer (`portal-server-agent` ~60s); readers apply a staleness gate.
5. **Version/namespace bump on deploy.** Cache keys carry an app/version prefix so a deploy abandons the prior namespace.

## L2 distributed store — use cases & data structures

All L2 caches, and the LiveStatus store, use one **shared cache storage account** in `portal-core`. Table Storage keys: `PartitionKey` (PK) groups rows on a partition; `RowKey` (RK) is the unique id; expiry is a stored `ExpiresUtc` filtered on read.

> **Two storage models on one account.** **LiveStatus** (status + players) is a **hand-rolled domain store** (`TableStorageLiveStatusStore`, already existing) with the typed columns below — it is event-populated, **not** `MX.Caching`. The **generic cache-aside** entries (FC-6/8/9) go through `IMxCache` → HybridCache → the generic `TableStorageDistributedCache`, which stores each entry as an **opaque serialized `Value` (bytes) + `ExpiresUtc` + tag columns**. For those rows the **PartitionKey / RowKey / Value shape** columns below describe the **logical cache key and the shape of the serialized value** — the physical layout is owned by HybridCache + the generic adapter. **Do not hand-roll per-use-case Table entities for FC-6/8/9** — call `IMxCache` and let the adapter store the blob.

| Use case                              | PartitionKey                          | RowKey                | Value shape                                                   | TTL                         | Invalidation                                                 |
| ------------------------------------- | ------------------------------------- | --------------------- | ------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| Live server status                    | `gameServerId`                        | `"status"`            | title, map, mod, gameType, max/current players, `LastUpdated` | none (event-refreshed ~60s) | Producer overwrite                                           |
| Live players                          | `gameServerId`                        | player `Num`/slot     | name, score, ping, ip, playerId, geo JSON, `ConnectedAtUtc`   | none                        | Producer overwrite (replace set)                             |
| Server query fallback (FC-1)          | `gameServerId`                        | `"query"`             | name/score snapshot                                           | short TTL on stale-miss     | Separate key; does **not** overwrite the enriched LiveStatus |
| Player-id resolution (FC-4)           | `gameType`                            | `playerGuid`          | `{ playerId, resolvedUtc }`                                   | none (immutable)            | Optional purge job                                           |
| Reference cache-aside (FC-6)          | entity type (`"gameserver"`, `"map"`) | `entityId`            | `{ json, tag, cachedUtc, expiresUtc }`                        | 60s / 5–15m                 | Tag eviction on `PUT/PATCH/DELETE`                           |
| Dashboard aggregations (FC-8)         | `"dashboard"`                         | `"{metric}:{window}"` | `{ json, expiresUtc }`                                        | 60–120s                     | TTL only                                                     |
| Per-server settings resolution (FC-9) | `gameServerId` (or `"global"`)        | `namespace`           | `{ resolvedJson, version, cachedUtc }`                        | 5–10 min backstop           | Tag eviction on config `Upsert`                              |

### Per-server settings resolution

The resolved settings document — per-server override → global → default, per namespace — is cached keyed by `(gameServerId, namespace)`. `UpsertConfiguration` evicts the tag for that server+namespace; a global-namespace write evicts every server's entry for that namespace.

### Not cached

- **GeoIP / IP intelligence** — owned and cached by `geo-location`; consumers call it and never re-cache.
- **User claims / permissions** — L1 per-instance short TTL only; never shared-cached (auth-scoped).
- **Player-id + tags context (`portal-server-events`)** — kept as the existing per-instance ~15-min L1 in the processors; deliberately **not** promoted to a shared L2. The cached `{ PlayerId, Tags }` carries **mutable authorization Tags** (changed by forum sync / manual claim edits) that a long-TTL shared cache would serve stale.
- **`GetGameServer` as a client L2** — L1 + server cache-aside only (cheap origin).
- **Game types / static enums** — compiled; nothing to cache.

# Phase 0 · Part 2 — Implement, Test & Publish the Packages

Implement the four `MX.Caching*` packages, resolve the tag-eviction spike, test, and publish the first NBGV release. **Gated on NuGet publish** — later phases consume the published versions; do not bridge with cross-repo project references.

> Do **not** start Part 2 until [part-1-repo-and-scaffold.md](part-1-repo-and-scaffold.md) exit gate passes (repo provisioned, skeleton CI green).

## 2.A — `MX.Caching.Abstractions` (no third-party deps)

Pure contracts so both the future client decorator and server cache-aside depend on abstractions, not the impl.

- **Do:**
  - `IMxCache` — `GetOrCreateAsync<T>(key, factory, policy, tags, ct)`, `TryGetAsync<T>`, `SetAsync<T>`, `RemoveAsync(key)`, `RemoveByTagAsync(tag)`.
  - `CachePolicy` — `Tier` (`InProcess` / `Distributed` / `Tiered` / `None`), `Ttl`, optional `L1Ttl`/`L2Ttl`, `Tags`, `NegativeTtl`.
  - `CacheTier` enum; a `CacheKey` builder contract (client + method + normalised args + **version prefix**).
  - `CacheOptions` — `Backend` enum (`TableStorage` default, `Memory`, `Redis`, `Cosmos`) + per-backend option holders (`TableStorageCacheOptions { Endpoint }`). Per-policy `Enabled` + the `Backend` switch are the **config kill-switch** (no feature flag) — set `Memory`, disable a policy, or drop a TTL to 0 to turn caching off per environment.
  - `IMxCacheMetrics` — hit / miss / evict counters emitted via `System.Diagnostics.Metrics.Meter` (vendor-neutral), so both tiers observe identically and each host's observability collects them.
- **Acceptance:** builds with **zero** external package references; public API reviewed for minimality.

## 2.B — `MX.Caching` (core, HybridCache-backed)

- **Do:**
  - `HybridMxCache : IMxCache` delegating to `HybridCache` — map `CachePolicy` → `HybridCacheEntryOptions` + tags, record metrics. **Do not reimplement** L1/L2/stampede/serialization; HybridCache owns them.
  - **Policy resolver** with the precedence `config → consumer override → library default → uncached`, honouring the `NotCached` guard (only an explicit override can enable a `NotCached` endpoint).
  - `AddMxCaching(this IServiceCollection, IConfiguration)` — bind `CacheOptions` (`MxCaching` section), register `HybridCache`, and invoke the **config-driven backend factory** to register the matching `IDistributedCache`. Backend impls self-register (Table via 2.C; `Memory` via 2.D).
  - Envelope-awareness hook (cache only success / `NotFound`; never `5xx`/exceptions) for the client decorator to use later. **Decided pattern:** to keep HybridCache's single-flight *and* skip non-cacheable results, the `GetOrCreateAsync` factory returns success/`NotFound` normally (cached) but **throws a private sentinel exception** for a non-cacheable result; the facade catches the sentinel *outside* HybridCache and returns the original error `ApiResult` **uncached** (a factory that throws is not cached, so single-flight is preserved for cacheable results).
- **Acceptance:** `AddMxCaching` with `Backend=TableStorage` wires Table; with `Backend=Memory` wires the in-memory distributed cache; no call-site change between them.

## 2.C — `MX.Caching.TableStorage`

- **Do:**
  - `TableStorageDistributedCache : IDistributedCache` over `Azure.Data.Tables` using `TableServiceClient` + `DefaultAzureCredential` (**managed identity — no keys**, per `standards.oidc-and-secrets`).
  - Entity carries `Value` (bytes), `ExpiresUtc` (manual expiry filtered on read — the geo-location pattern), and tag columns.
  - `AddMxCachingTableStorage(...)` registration, selected when `CacheOptions.Backend = TableStorage`.
  - **Tag side-index** — build **only if 2.E requires it**: a secondary partition mapping `tag → keys` backing `RemoveByTagAsync`.
- **Acceptance:** get/set/expiry pass against **Azurite**; credential path uses `DefaultAzureCredential`.

## 2.D — `MX.Caching.Testing`

- **Do:** `AddMxCachingMemory()` (in-memory distributed cache for tests), a `FakeMxCache` with call tracking, and hit/miss/eviction assertion helpers. Mirrors the org `*.Testing` convention.
- **Acceptance:** a consumer test project can swap to the memory backend via config alone.

## 2.E — Spike: HybridCache tag eviction over Table Storage

- **Do:** Validate that `HybridCache` **tag-based invalidation propagates cross-instance** when backed by the Table `IDistributedCache` (HybridCache tracks tag-expiration state; confirm it round-trips through the Table store across two processes/instances).
- **Outcome A (works):** no side-index needed; document the result.
- **Outcome B (does not propagate):** implement the **tag side-index** in `MX.Caching.TableStorage` (2.C) and route `RemoveByTagAsync` through it; re-test.
- **Gate:** This is the only open technical risk — resolve and document it **before** the first release is treated as `1.0`-track.

## 2.F — Tests

- **Do:** xUnit + Moq (+ Azurite for the Table adapter). Cover: policy precedence (`config → override → default → uncached`, `NotCached`), key builder / version prefix, negative caching, envelope-awareness, Table adapter get/set/expiry, and the 2.E tag-eviction outcome.
- **Validate:**
  ```pwsh
  dotnet build src/MX.Caching.sln
  dotnet test src/MX.Caching.sln --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/MX.Caching.sln --verify-no-changes
  ```

## 2.G — Release & publish gate

- **Do:** Ensure `build-and-test`, `pr-verify`, `codequality`, `devops-secure-scanning` are green. Cut the first release via `release-version-and-tag.yml` → `release-publish-nuget.yml` to publish `MX.Caching*` (`0.x`) to NuGet.org.
- **Acceptance / gate:** A scratch console project restores `MX.Caching`, `MX.Caching.TableStorage`, `MX.Caching.Testing` from NuGet.org and `AddMxCaching(config)` resolves. **Only then** may Phase 2+ consume them.

## Part 2 exit gate (= Phase 0 done)

- Four packages published `0.x`, multi-TFM, restorable by a scratch project.
- Backend selectable by config (`TableStorage` default / `Memory` in tests) with no code change.
- Policy precedence + `NotCached` covered by tests.
- Tag-eviction spike resolved and documented (side-index built if required).
- No consumer wired (Phase 2+).

## Next

[Phase 1 — Client caching capability](../portal-caching-phase-1/README.md): the `.WithCaching(...)` fluent decorator + policy model in `MX.Api.Client`, consuming these packages (see also [spec README → rollout phases](../portal-caching-spec/README.md#rollout-phases)).

# Phase 1 · Part 1 — `.WithCaching` Client Decorator & Policy Model

Implement the client caching capability in **`MX.Api.Client`** (`api-client-abstractions`), consuming the Phase 0 `MX.Caching` packages. **Gated on NuGet publish** — API phases consume the published `MX.Api.Client`.

> Prerequisite: Phase 0 packages published ([portal-caching-phase-0/](../portal-caching-phase-0/README.md)).

## 1.A — Reference `MX.Caching`
- **Do:** Add `MX.Caching.Abstractions` (+ `MX.Caching` for the DI wiring) package references to `MX.Api.Client`. Register nothing by default — caching stays opt-in.
- **Do:** Configure HybridCache with a **Newtonsoft.Json `IHybridCacheSerializer`** that reuses the API clients' existing JSON settings. **Required:** the DTOs use `internal set` accessors + Newtonsoft `[JsonProperty]`; the default System.Text.Json serializer would return empty/default properties from L2.
- **Acceptance:** solution restores/builds; a round-trip test proves a DTO with `internal set` properties (e.g. `GameServerDto`) survives serialize→deserialize through the configured serializer.

## 1.B — `.WithCaching(...)` fluent extension + policy registry
- **Do:** Add `WithCaching(this ApiClientOptionsBuilder, Action<CacheBuilder>)`. `CacheBuilder` records per-method policies:
  - `InMemory<TApi>(expr, ttl)`, `Distributed<TApi>(expr, ttl)`, `Tiered<TApi>(expr, l1Ttl, l2Ttl)`, `NotCached<TApi>(expr?)`.
  - `expr` is an **invocation expression** (e.g. `x => x.GetGameServer(default, default)`) from which the **`MethodInfo`** is extracted — this disambiguates **overloads** such as `IMapsApi.GetMap(Guid)` vs `GetMap(GameType, string)`, which a bare method name cannot.
  - Library-default vs consumer forms: `UseLibraryDefaults()`, `WithoutLibraryDefaults()`, `Override<>`, `Add<>`, `Disable<>`.
  - Bind an optional config section for TTL/enabled overrides.
  - Define `WithCaching` generically over the builder's self type (the CRTP `ApiClientOptionsBuilder<TOptions, TBuilder>` returns `TBuilder`) so it preserves fluent chaining with `WithBaseUrl` / `WithEntraIdAuthentication` regardless of the concrete client builder.
- **Do:** Add `AddDefaultCachePolicies<TClient>(this IServiceCollection, Action<CacheBuilder>)` — the mechanism a **client package** (Phase 2/3) calls inside its `AddXxxApiClient(...)` to register its shipped defaults into DI, which a consumer's `UseLibraryDefaults()` then pulls in. This closes the two-sided model: package ships defaults, consumer opts in / overrides.
- **Do:** A **policy resolver** producing the effective `CachePolicy` per method with precedence `config → consumer Override/Add/Disable → library NotCached → library default → uncached`; a `NotCached` guard is only overridable by an explicit `Override`.
- **Acceptance:** unit tests assert each precedence branch, the `NotCached` guard, and that a package-registered default is honoured by a consumer `UseLibraryDefaults()`.

## 1.C — Transparent decorator over typed feature interfaces
- **Do (preferred, confirmed viable):** Decorate the typed feature-API interfaces (e.g. `IGameServersApi`, exposed by the aggregate client as `client.GameServers.V1`). Each is **DI-registered** by `AddTypedApiClient<IXxxApi, XxxApi, …>` and injected into the version selectors, so a DI decorator over the registration is picked up by `client.Xxx.V1`. **Fallback (only if a specific interface proves non-decoratable):** decorate the DI-registered **`IRestClientService`** (`ExecuteAsync(baseUrl, request, ct)`, which `BaseApi` calls inside its retry policy) — **not** `BaseApi.ExecuteAsync` (a non-virtual instance method, not a DI seam) — gating on a per-request policy and keying by method + resource + version.
- **Do (method identity):** A policy targets a specific **`MethodInfo`** (declaring interface + method name + parameter types), extracted from the invocation expression above; this is distinct from the **cache key**, which additionally includes the **normalised argument values** + API-version prefix.
- **Do:** When any policy is registered for a method, on each call resolve the policy; if cached, call `IMxCache.GetOrCreateAsync(key, () => inner.Method(...), policy, tags)`; else pass through.
  - **Key** = client + method + normalised args + API-version prefix.
  - **Envelope-aware:** only cache results where `IApiResult<T>` is success or `NotFound`; never cache `5xx`/exceptions — use the **sentinel-throw pattern** from [Phase 0 · 2.B](../portal-caching-phase-0/part-2-packages.md) to preserve single-flight.
  - **Tags** from the policy (e.g. `gameserver:{id}`) for later eviction.
- **Acceptance:** a typed interface method returns a cached `ApiResult<T>` on the second call with no call-site change; error results are not cached; the cached DTO's `internal set` properties are populated (proves the serializer).

## 1.D — Metrics
- **Do:** Emit hit/miss/eviction via `IMxCacheMetrics` backed by `System.Diagnostics.Metrics.Meter` (vendor-neutral; the host's existing App Insights / OpenTelemetry collects it), tagged by client + method.
- **Acceptance:** metrics recorded in a test double.

## 1.E — Tests & validate
- **Do:** xUnit + Moq covering the builder, resolver precedence, decorator caching/pass-through, envelope-awareness, tag propagation.
- **Validate:**
  ```pwsh
  dotnet build src/MX.Api.Abstractions.sln
  dotnet test src/MX.Api.Abstractions.sln --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/MX.Api.Abstractions.sln --verify-no-changes
  ```

## 1.F — Publish gate
- **Do:** Release `MX.Api.Client` (via the repo's release workflows) to NuGet.org.
- **Gate:** A scratch client registers `.WithCaching(...)` against a fake typed interface and observes a cache hit. **Only then** may Phase 2/3 client packages ship default policies.

## Part 1 exit gate (= Phase 1 done)
- `.WithCaching(...)` + resolver + transparent decorator + metrics shipped and published.
- Precedence, `NotCached`, envelope-awareness tested.
- No consumer wired yet.

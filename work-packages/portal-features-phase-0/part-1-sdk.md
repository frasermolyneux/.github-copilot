# Part 1 — Build & Publish the Feature SDK

Build the `portal-feature-sdk` repo: two packages (`FeatureSdk`, `FeatureSdk.Web`) + `.Testing` companions, containing the extension **contracts** and the host **infrastructure**. Ends at a **hard publish gate** — Part 2 ([part-2-integration.md](part-2-integration.md)) does not start until the packages restore from NuGet.org.

> Conventions and golden rules: [README.md](README.md). This part is decision-locked per the README's resolved decisions.

---

## 1.0 — Provision the repo (platform-workloads prerequisite)

**Do:** Open a PR in `platform-workloads` adding a workload JSON for `portal-feature-sdk` (GitHub repo + workload identity + the standard NuGet-publishing wiring, mirroring how `api-client-abstractions` is defined). This is a **package/infra prerequisite** — surface it first and let the requester review/merge it.

**Acceptance:** `frasermolyneux/portal-feature-sdk` exists with OIDC identity and the `NuGet` environment/secret (`NUGET_API_KEY`) available to workflows.

**Gate:** Do not proceed to 1.1 until the repo exists.

---

## 1.1 — Scaffold the repo

**Do:** In the new repo:
1. Metadata (use `update-project-metadata`): `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/copilot-instructions.md`, `AGENTS.md`, `.github/CODEOWNERS`, PR/issue templates.
2. Workflows (use `align-project-workflows`) — **library repo**: `build-and-test.yml`, `pr-verify.yml`, `codequality.yml`, `copilot-setup-steps.yml`, `dependabot-automerge.yml`, `release-version-and-tag.yml`, `release-publish-nuget.yml`, `.github/dependabot.yml`. **No terraform, no deploy-dev/prd.**
3. `.vscode/tasks.json` (use `align-vscode-dotnet-tasks`).
4. Root `version.json` — copy `api-client-abstractions`'s (NBGV, `gitTagVersionPrefix: v`, `prerelease: preview`), set `"version": "0.1"`.
5. Root `Directory.Build.props` — copy `api-client-abstractions`'s (LangVersion latest, Nullable, ImplicitUsings, `GenerateDocumentationFile`, `TreatWarningsAsErrors`, analyzers `latest-recommended`, package metadata: Authors "Fraser Molyneux", Company "Molyneux.IO", `PackageLicenseExpression GPL-3.0-only`, SourceLink/symbols, NBGV `3.9.50`).
6. Root `Directory.Packages.props` — central package versions (mirror the Microsoft.Extensions.* `10.0.9` line used by `api-client-abstractions`).

**Acceptance:** Repo builds an empty solution; CI green.

---

## 1.2 — Solution & projects

**Do:** Create `src/XtremeIdiots.Portal.FeatureSdk.sln` with:

| Project                                      | SDK                       | TFMs             | Key references                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `XtremeIdiots.Portal.FeatureSdk`             | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | `XtremeIdiots.Portal.Repository.Api.Client.V1`, `XtremeIdiots.Portal.Integrations.Servers.Api.Client.V1`, `MX.GeoLocation.Abstractions` (DTO-only, for `IpIntelligenceDto` on `PlayerConnection`), `MX.Observability.ApplicationInsights` (for `IAuditLogger`/`IJobTelemetry`), `Microsoft.Extensions.Caching.Memory`, `Microsoft.Extensions.DependencyInjection.Abstractions`, `Microsoft.Extensions.Options`, `Microsoft.Extensions.Logging.Abstractions` |
| `XtremeIdiots.Portal.FeatureSdk.Web`         | `Microsoft.NET.Sdk.Razor` | `net9.0;net10.0` | ProjectRef `FeatureSdk`; `FrameworkReference Microsoft.AspNetCore.App`                                                                                                                                                                                                                                                                                                                                                                                      |
| `XtremeIdiots.Portal.FeatureSdk.Testing`     | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | ProjectRef `FeatureSdk`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `XtremeIdiots.Portal.FeatureSdk.Web.Testing` | `Microsoft.NET.Sdk`       | `net9.0;net10.0` | ProjectRef `FeatureSdk.Web`; `Microsoft.Playwright`; `FrameworkReference Microsoft.AspNetCore.App`                                                                                                                                                                                                                                                                                                                                                           |
| `XtremeIdiots.Portal.FeatureSdk.Tests`       | test                      | `net9.0;net10.0` | `FeatureSdk`, `FeatureSdk.Testing`, xUnit, Moq, coverlet                                                                                                                                                                                                                                                                                                                                                                                                    |
| `XtremeIdiots.Portal.FeatureSdk.Web.Tests`   | test                      | `net9.0;net10.0` | `FeatureSdk.Web`, `FeatureSdk.Web.Testing`, xUnit, Moq                                                                                                                                                                                                                                                                                                                                                                                                      |
| `XtremeIdiots.Portal.FeatureSdk.Web.TestHost.Sample` | `Microsoft.NET.Sdk.Razor` (private, non-packable) | `net9.0;net10.0` | `FeatureSdk.Web`; one controller/view/static asset plus navigation/profile/dashboard/settings contributors                                                                                                                                                                                                                                                                                                                                                  |
| `XtremeIdiots.Portal.FeatureSdk.Web.IntegrationTests` | test (non-packable)       | `net9.0;net10.0` | `FeatureSdk.Web.Testing`, `FeatureSdk.Web.TestHost.Sample`, `Microsoft.Playwright`, xUnit                                                                                                                                                                                                                                                                                                                                                                    |

Each package project: `GeneratePackageOnBuild=true`, `PackageId` = project name, a `Description`, `PackageReadmeFile=README.md`, and a per-project `README.md` packed to root.

The sample host and integration-test projects are solution members but never packed. Their explicit project names are part of the standard browser-test convention used by feature repositories.

**Acceptance:** Solution builds; four `.nupkg` produced.

> `GameType` and `PermissionScope` come from `XtremeIdiots.Portal.Repository.Abstractions.Constants.V1` (transitively via the Repository client package). `IRepositoryApiClient` / `IServersApiClient` come from the two client packages.

---

## 1.3 — `FeatureSdk` contracts

Create these under folders in `XtremeIdiots.Portal.FeatureSdk`. Signatures are the contract; keep them minimal.

### Game/
```csharp
public interface IGameScoped { IReadOnlyCollection<GameType> SupportedGames { get; } } // empty => all

public static class GameScope
{
    public static bool Supports(IReadOnlyCollection<GameType> supported, GameType game)
        => supported is null || supported.Count == 0 || supported.Contains(game);
}
```

### Settings/
```csharp
public enum SettingsScope { Global, GameServer, Both }

public interface IFeatureSettingsContract
{
    static abstract string Namespace { get; }
    static abstract SettingsScope Scope { get; }
}

public sealed record SettingsValidationResult(bool IsValid, IReadOnlyList<string> Errors)
{
    public static SettingsValidationResult Ok { get; } = new(true, Array.Empty<string>());
    public static SettingsValidationResult Fail(params string[] errors) => new(false, errors);
}

public interface IFeatureSettingsValidator<TContract> { SettingsValidationResult Validate(TContract value); }

public sealed record RegisteredSettingsNamespace(string Namespace, SettingsScope Scope, Type ContractType, Type? ValidatorType);

public interface IFeatureSettingsRegistry
{
    IReadOnlyCollection<RegisteredSettingsNamespace> Namespaces { get; }
    bool TryGet(string @namespace, out RegisteredSettingsNamespace registration);
}

// Generic resolver: per-server override -> global -> built-in default; deserialises the
// namespace JSON (read via the Repository client) into the feature's contract type.
public interface IFeatureSettingsResolver
{
    ValueTask<T> ResolveAsync<T>(string @namespace, Guid? serverId, T builtInDefault, CancellationToken ct)
        where T : IFeatureSettingsContract;
}

// Structural-only settings validation for portal-repository to MIRROR (copy the rule; no SDK ref):
// well-formed JSON for a non-empty namespace. Semantic validation lives at the writer.
public static class StructuralSettingsValidator
{
    public static bool IsWellFormed(string @namespace, string json);
}
```

> **Ownership:** the feature owns its settings contract + validator in `.Abstractions`. `portal-repository` validates **structurally only** (never references a feature). The **writer** (`portal-web`) validates semantically with the feature's validator. See [architecture.md](../portal-features-spec/architecture.md#settings-plane-foundational).

### Permissions/
```csharp
public sealed record PermissionDefinition(
    string ClaimType, string DisplayName, string Description,
    string Domain, string? SubDomain, PermissionScope Scope);

public interface IPermissionContributor { IEnumerable<PermissionDefinition> GetPermissions(); }

public interface IPermissionCatalog
{
    IReadOnlyCollection<PermissionDefinition> All { get; }
    bool IsKnown(string claimType);
    PermissionDefinition? Get(string claimType);
}

public static class StructuralPermissionValidator
{
    // True if claimType matches "{Domain}.{Action}" (non-empty segments) AND
    // claimValue parses as a GameType != Unknown OR as a Guid.
    public static bool IsWellFormed(string claimType, string claimValue);
}
```

### Events/
```csharp
public interface IServerEvent
{
    Guid ServerId { get; }
    GameType GameType { get; }
    DateTime EventGeneratedUtc { get; }
    long SequenceId { get; }   // monotonic per server; available for idempotency / dedup
}

// Full queue set (decision 1 = full pipeline). These field lists are PROVISIONAL — reconcile each record
// field-by-field against the matching Server.Events.Abstractions.V1 DTO when you write the host mapping
// (Part 2) and RE-CONFIRM before the Phase 4 freeze. On the wire GameType is a string (parsed to the enum
// at the mapping boundary). Example miss already found: SteamId on PlayerConnectedEvent below.
public sealed record ChatMessageEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId,
    string PlayerGuid, string Username, int SlotId, string Message) : IServerEvent;
public sealed record PlayerConnectedEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId,
    string PlayerGuid, string Username, string? SteamId, int SlotId, string? IpAddress) : IServerEvent;
public sealed record PlayerDisconnectedEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId,
    string PlayerGuid, string Username, int SlotId) : IServerEvent;
public sealed record MapChangeEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId,
    string MapName) : IServerEvent;
public sealed record ServerConnectedEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId) : IServerEvent;
public sealed record ServerStatusEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId,
    string? MapName, IReadOnlyList<StatusPlayer> Players) : IServerEvent;
public sealed record StatusPlayer(string PlayerGuid, string Username, int SlotId, string? IpAddress);
public sealed record BanAppliedEvent(...) : IServerEvent;
public sealed record BanFileChangedEvent(...) : IServerEvent;
public sealed record BanLiftAppliedEvent(...) : IServerEvent;
public sealed record BanSyncFailedEvent(...) : IServerEvent;
public sealed record PlayerIpResolvedEvent(Guid ServerId, GameType GameType, DateTime EventGeneratedUtc, long SequenceId,
    string PlayerGuid, string IpAddress) : IServerEvent;

public interface IServerEventHandler<TEvent> : IGameScoped where TEvent : IServerEvent
{
    int Order { get; }   // 0-99 core/persistence, 100-199 enrichment, 200-299 reaction
    Task HandleAsync(TEvent evt, IServerEventContext ctx, CancellationToken ct);
    // No return value: the pipeline runs every matching handler in order. There is NO
    // short-circuit today (nothing in the estate needs one). If one is ever required it is
    // added deliberately as an additive change (a context signal or a new result type).
}

public interface IServerEventPipeline
{
    Task RunAsync<TEvent>(TEvent evt, CancellationToken ct) where TEvent : IServerEvent;
}
```

> Fill the `Ban*Event` fields — and **re-verify every record** (e.g. `PlayerConnectedEvent.SteamId`) — from the matching `Server.Events.Abstractions.V1` DTOs when you write the host mapping in Part 2. The persistence handlers consume these fields and the records freeze at `v1.0` in **Phase 4**, so a missing/renamed field is a costly miss. **Gate: all event records reconciled against the wire DTOs before the freeze.**

### Commands/ (cross-feature chat sub-contract)
```csharp
public interface IChatCommand : IGameScoped
{
    ChatCommandMetadata Metadata { get; }   // Metadata.Prefix is the trigger, e.g. "!like"
    Task<CommandResult> ExecuteAsync(CommandContext ctx, CancellationToken ct);
}
public sealed record ChatCommandMetadata(string Name, string Prefix, string Usage, string Description, bool IsMutating);
public sealed record CommandContext(Guid ServerId, GameType GameType, string PlayerGuid, string Username, int SlotId,
    string Message, Guid? PlayerId, IServerEventContext Context);
public sealed record CommandResult(bool Handled, string? Reply = null);
```
> This is the **minimal** cross-feature contract so feature packages (e.g. Maps' map-vote commands) can ship `IChatCommand`s. The **rich command framework** currently in `portal-server-events/Commands/*` (parser, catalog, authorization, safety, idempotency, rate limiting) stays in the host in Phase 0 and is refactored to consume this SDK contract; it becomes the Chat Commands feature in Phase 3.

### Context/
```csharp
public sealed record ServerReference(Guid Id, GameType GameType, string Title, string Hostname, int QueryPort);
public sealed record PlayerReference(Guid Id, GameType GameType, string PlayerGuid, string Username);
public sealed record LivePlayer(string PlayerGuid, string Username, int SlotId);
public sealed record LiveServerState(string? CurrentMap, IReadOnlyList<LivePlayer> Players, DateTime LastUpdated);

public interface IServerEventContext
{
    Guid ServerId { get; }
    GameType GameType { get; }
    DateTime EventGeneratedUtc { get; }
    long SequenceId { get; }
    ValueTask<ServerReference> GetServerAsync(CancellationToken ct);
    ValueTask<PlayerReference?> GetPlayerAsync(string playerGuid, CancellationToken ct);
    ValueTask<LiveServerState> GetLiveStateAsync(CancellationToken ct);
}

public interface IServerEventContextFactory { IServerEventContext Create(IServerEvent evt); }
```

### Connection/
```csharp
// PlayerConnected / PlayerIpResolved are SINGLE core orchestration handlers (decision 17), NOT independent
// pipeline handlers. The core handler runs a fixed sequence and calls these feature collaborators
// (no-op SDK defaults; exactly one active implementation each, swapped by flag-gated registration).
public sealed class PlayerConnection
{
    public required Guid ServerId { get; init; }
    public required GameType GameType { get; init; }
    public required Guid PlayerId { get; init; }
    public required string PlayerGuid { get; init; }
    public required string Username { get; init; }
    public int? SlotId { get; init; }
    public IReadOnlyCollection<string> PlayerTags { get; set; } = Array.Empty<string>();
    public IpIntelligenceDto? Intelligence { get; set; }   // set by the enricher; read by guard + greeter
    public bool GuardWasDestructive { get; set; }          // guard sets this (e.g. VPN kick) => greeter skipped
}

public interface IConnectionEnricher                    { Task EnrichAsync(PlayerConnection c, CancellationToken ct); }  // platform GeoIP (host-registered)
public interface IConnectionGuard       : IGameScoped   { Task GuardAsync(PlayerConnection c, CancellationToken ct); }   // AutoAdmin: VPN-detected tag + VPN kick
public interface IProtectedNameEnforcer : IGameScoped   { Task EnforceAsync(PlayerConnection c, CancellationToken ct); } // AutoAdmin (CoD4x)
public interface IConnectionGreeter     : IGameScoped   { Task GreetAsync(PlayerConnection c, CancellationToken ct); }   // Welcome Messages
```
> `IpIntelligenceDto` is from `MX.GeoLocation.Abstractions`. The **core `PlayerConnected` / `PlayerIpResolved` orchestration handlers are host-owned** (registered in [Part 2 §2.B](part-2-integration.md#2b--portal-server-events-full-pipeline-decomposition-decision-1)); the SDK ships only these contracts + **no-op defaults**. Core sequence: `persist → protected-name → enrich → guard → greet (only if !GuardWasDestructive)`. See [architecture.md](../portal-features-spec/architecture.md#connection-orchestration-single-core-handler-feature-collaborators).

### Cache/
```csharp
public enum FeatureCacheTier { Request, InProcess, Distributed }

public interface IFeatureCache
{
    ValueTask<T> GetOrAddAsync<T>(string key, Func<CancellationToken, ValueTask<T>> factory,
        FeatureCacheTier tier, TimeSpan? ttl, CancellationToken ct);
    void Invalidate(string key);
}
```

### Rcon/
```csharp
public enum RconCapability { CurrentMap, Say, Kick, Ban, MapControl, Restart }

public interface IRconGateway
{
    Task<string?> GetCurrentMapAsync(Guid serverId, GameType game, CancellationToken ct);
    Task SayAsync(Guid serverId, GameType game, string message, CancellationToken ct);
    Task KickAsync(Guid serverId, GameType game, int slotId, string reason, CancellationToken ct);
    Task BanAsync(Guid serverId, GameType game, string playerGuid, string reason, CancellationToken ct);
    bool Supports(GameType game, RconCapability capability);
}
```

### Jobs/
```csharp
public sealed record JobContext(string JobName, string RunId, DateTime StartedUtc);

public interface IScheduledJob : IGameScoped
{
    string Name { get; }
    string CronExpression { get; }
    Task ExecuteAsync(JobContext ctx, CancellationToken ct);
}

public enum ReconciliationPhase { Reset, Project, Reconcile }   // Project reserved for future project-then-reconcile sets

public interface IReconciliationJob : IScheduledJob
{
    string Set { get; }               // e.g. "PlayerTags"
    ReconciliationPhase Phase { get; }
    int Order { get; }
}

public interface IJobRunner
{
    Task RunAsync(string jobName, CancellationToken ct);       // run one job by Name
    Task RunSetAsync(string set, CancellationToken ct);        // run a reconciliation set by phase then order
}
```

**Acceptance (1.3):** `FeatureSdk` compiles with **no ASP.NET reference**; `dotnet list package` shows only the intended deps.

---

## 1.4 — `FeatureSdk` host infrastructure (default implementations)

Implement these in `FeatureSdk`; behaviour specs below.

- **`ServerEventPipeline : IServerEventPipeline`** — resolves `IEnumerable<IServerEventHandler<TEvent>>` from DI; filters by `GameScope.Supports(handler.SupportedGames, evt.GameType)`; orders by `Order`, tie-broken by handler type full name (deterministic); creates the context via `IServerEventContextFactory`; runs **every** matching handler **sequentially**, in order; **lets handler exceptions propagate** to the caller (preserving today's dead-letter behaviour — do **not** swallow). Log each handler start/completion at Debug. Precompute and **cache the ordered handler list per `TEvent`** (the registered set is fixed at startup).
- **`ServerEventContext` + `ServerEventContextFactory`** — the context's lazy getters use `IFeatureCache` (InProcess tier, short TTL) over `IRepositoryApiClient` for server/player reference **and for live state (via the Repository API live-status endpoint — not a direct table read)**. Cache keys: `server:{id}`, `player:{game}:{guid}`, `live:{id}`.
- **`FeatureCache : IFeatureCache`** — `Request` tier = a scoped state object (registered `Scoped`) holding a `Dictionary<string,object>` guarded by a lock; `InProcess` tier = `IMemoryCache` with the supplied TTL; `Distributed` tier = **falls back to InProcess** for now (L2 seam; adopt the `MX.Api.Client` decorator later). `GetOrAddAsync` de-dupes concurrent factory calls per key.
- **`RconGateway : IRconGateway`** — wraps `IServersApiClient`; contains the per-game `switch` lifted verbatim from `RconResponseService` / `MapVoteCommandBase` (`Cod2Rcon` / `Cod4Rcon` / `CoD4xRcon` / `Cod5Rcon` / `InsurgencyRcon` / `L4d2Rcon` / `RustRcon`). `Supports` returns whether that game+capability has a backing client/op. Wrap calls in dependency telemetry consistent with today.
- **`JobRunner : IJobRunner`** — `RunAsync(name)` resolves the `IScheduledJob` whose `Name == name`, wraps it in `IJobTelemetry.ExecuteAsync` when that service is registered, logs start/success/failure. `RunSetAsync(set)` selects `IReconciliationJob` where `Set == set`, orders by `Phase` then `Order`, runs sequentially.
- **`FeatureSettingsResolver : IFeatureSettingsResolver`** — resolves per-server override → global → built-in default by reading the namespace JSON via `IRepositoryApiClient` (cached through `IFeatureCache`) and deserialising into the feature contract. Features never touch raw JSON.
- **`FeatureSettingsRegistry : IFeatureSettingsRegistry`** and **`PermissionCatalog : IPermissionCatalog`** — aggregate the registered contracts / `IPermissionContributor`s; **throw on duplicate namespace / duplicate claim type**.
- **Connection collaborators (no-op defaults).** The SDK registers no-op `IConnectionEnricher` / `IConnectionGuard` / `IProtectedNameEnforcer` / `IConnectionGreeter` so the host-owned `PlayerConnected` / `PlayerIpResolved` orchestration handlers resolve cleanly when a collaborator has no active implementation. The **platform GeoIP enricher** is a real implementation but is **host-registered** (it needs `IGeoLocationApiClient`); features override the guard / enforcer / greeter (flag-gated). Exactly one implementation of each is active.
- **Dependency assertion** — `AddPortalFeatureCore()` (and a reusable `AssertRegistered<T>()` helper) validates at startup that the host registered the **always-required** shared prerequisites (`IRepositoryApiClient`, `IMemoryCache`, `IAuditLogger`) and throws a clear, service-named message. **`IServersApiClient` is asserted separately by `AddPortalFeatureRcon()`**, which only the event/web hosts call — the timer hosts never resolve `IRconGateway`, so they must not be forced to register it.

### Registration extensions (`ServiceCollectionExtensions`)
```csharp
public static IServiceCollection AddPortalFeatureCore(this IServiceCollection s);
//  registers: IServerEventPipeline, IServerEventContextFactory, IFeatureCache (+ scoped request state),
//             IRconGateway, IJobRunner, IFeatureSettingsRegistry, IFeatureSettingsResolver, IPermissionCatalog,
//             and NO-OP defaults for the connection collaborators (IConnectionEnricher/Guard/ProtectedNameEnforcer/Greeter).
//  ASSERTS the ALWAYS-required shared prerequisites: IRepositoryApiClient, IMemoryCache, IAuditLogger (AddObservability()).
//  IServersApiClient is NOT asserted here (the timer hosts never resolve IRconGateway).
//  A feature's own AddXxxFeature(...) may take a fluent options builder so the feature PROVIDES its
//  feature-specific dependencies (e.g. ContentSafetyClient) from host-supplied config values, and
//  fails fast if a required option is missing. Shared clients are consumed from DI, never re-registered.

public static IServiceCollection AddPortalFeatureRcon(this IServiceCollection s);
//  event/web hosts call this IN ADDITION to AddPortalFeatureCore(); it ASSERTS IServersApiClient
//  (the RCON gateway's backing client). Timer hosts do NOT call it.

public static IServiceCollection AddServerEventHandler<TEvent, THandler>(this IServiceCollection s)
    where TEvent : IServerEvent where THandler : class, IServerEventHandler<TEvent>;
public static IServiceCollection AddChatCommand<T>(this IServiceCollection s) where T : class, IChatCommand;
public static IServiceCollection AddScheduledJob<T>(this IServiceCollection s) where T : class, IScheduledJob;
public static IServiceCollection AddReconciliationJob<T>(this IServiceCollection s) where T : class, IReconciliationJob;
//  registers T under BOTH IScheduledJob and IReconciliationJob so IJobRunner.RunAsync (by name) and
//  RunSetAsync (by Set, ordered Phase then Order) both resolve it.
public static IServiceCollection AddFeatureSettings<TContract, TValidator>(this IServiceCollection s)
    where TContract : IFeatureSettingsContract where TValidator : class, IFeatureSettingsValidator<TContract>;
public static IServiceCollection AddPermissionContributor<T>(this IServiceCollection s) where T : class, IPermissionContributor;

// Connection collaborators (replace the SDK no-op default; exactly one active implementation each):
public static IServiceCollection AddConnectionEnricher<T>(this IServiceCollection s) where T : class, IConnectionEnricher;
public static IServiceCollection AddConnectionGuard<T>(this IServiceCollection s) where T : class, IConnectionGuard;
public static IServiceCollection AddProtectedNameEnforcer<T>(this IServiceCollection s) where T : class, IProtectedNameEnforcer;
public static IServiceCollection AddConnectionGreeter<T>(this IServiceCollection s) where T : class, IConnectionGreeter;
```

**Acceptance (1.4):** `AddPortalFeatureCore()` resolves cleanly in a test host with fake `IRepositoryApiClient`/`IServersApiClient`; pipeline/job runner behave per spec (covered by 1.7).

---

## 1.5 — `FeatureSdk.Web` contracts + infrastructure

### Contracts
```csharp
public sealed record NavItem(string Text, string Icon, string Controller, string Action,
    string? Policy, int Order, IReadOnlyCollection<GameType> SupportedGames, IReadOnlyList<NavItem>? Children = null);
public sealed record NavigationContext(ClaimsPrincipal User);
public interface INavigationContributor : IGameScoped { int Order { get; } IEnumerable<NavItem> GetItems(NavigationContext ctx); }

public sealed record PlayerProfileContext(Guid PlayerId, GameType GameType, ClaimsPrincipal User);
public interface IPlayerProfileBlock : IGameScoped { int Order { get; } string Policy { get; } Task<IViewComponentResult?> RenderAsync(PlayerProfileContext ctx); }

public sealed record DashboardContext(ClaimsPrincipal User);
public interface IDashboardWidget : IGameScoped { int Order { get; } string Policy { get; } Task<IViewComponentResult?> RenderAsync(DashboardContext ctx); }

public interface ISettingsSection : IGameScoped { string Namespace { get; } string DisplayName { get; } SettingsScope Scope { get; } string Policy { get; } }
```

### Infrastructure
- **`INavigationModelBuilder` / `NavigationModelBuilder`** — collects `INavigationContributor`s, filters each `NavItem` by `IAuthorizationService` (its `Policy`) and by `GameScope`, orders by `Order` (contributor then item), returns the model the layout renders.
- **Profile-block runner / dashboard runner** — resolve ordered blocks/widgets, filter by policy + game, render each (skip on `null`).
- **Settings-section registry** — exposes registered `ISettingsSection`s for the settings pages.
- **`AddFeatureControllers(this IServiceCollection, Assembly)`** — adds the assembly as an MVC `ApplicationPart`.
- **`AddPortalFeatureWeb()`** — registers the builders/runners/registry and the tag helpers.
- Registration helpers: `AddNavigationContributor<T>()`, `AddPlayerProfileBlock<T>()`, `AddDashboardWidget<T>()`, `AddSettingsSection<T>()`.

**Acceptance (1.5):** `FeatureSdk.Web` builds against `Microsoft.AspNetCore.App`; the nav builder filters by policy + game (covered by 1.7).

---

## 1.6 — `.Testing` companions

- **`FeatureSdk.Testing`:** `FakeServerEventContext` (settable server/player/live state), `FakeRconGateway` (records calls, configurable `Supports`), `FakeFeatureCache` (pass-through/no-op with call capture), `FakeAuditLogger`, `PipelineHarness` (register handlers, feed an event, capture the ordered list of handlers that ran), `ConnectionHarness` (runs a `PlayerConnection` through the registered collaborators and captures the order + whether the greeter was skipped), recording fakes for the four connection collaborators, and a `JobContext` factory.
- **`FeatureSdk.Web.Testing` unit fakes:** fake `NavigationContext` / `PlayerProfileContext` / `DashboardContext`, a stub `IAuthorizationService` (allow/deny by policy), fake authenticated principals/roles/claims, deterministic Repository/API-client fakes, recording contributors, and in-memory global/per-server settings persistence.
- **`FeatureSdk.Web.Testing` reference host:** `FeatureWebTestHostBuilder` accepts the feature Web assembly, service/configuration overrides, fake principal, policy outcomes, supported game, and optional seed settings. It creates a real `WebApplication`, calls `AddPortalFeatureCore()` + `AddPortalFeatureWeb()` + `AddFeatureControllers(featureAssembly)`, maps controllers/Razor pages/static web assets, and starts Kestrel on an OS-assigned loopback port. It exposes minimal SDK-owned test pages that render:
  - navigation from `INavigationModelBuilder`;
  - profile blocks for a configured player/game;
  - dashboard widgets;
  - global and per-server settings sections, with GET/POST round-trip through the SDK settings contract.
- **Playwright infrastructure:** `FeaturePlaywrightFixture` installs no browsers itself but launches Chromium from the standard Playwright installation, creates a fresh browser context per scenario/role, and exposes the host base URI. `FeatureBrowserSession` captures console errors, uncaught page errors, failed same-origin requests, HTTP 5xx responses, and unexpected external requests; disposal/assertion fails with all captured diagnostics. Supply helpers for authenticated/anonymous contexts and stable `data-testid` conventions, but keep feature assertions in each feature repository.
- **Contract boundary:** the reference host is deliberately minimal and versioned with `FeatureSdk.Web.Testing`. It validates RCL/Web-plane behaviour without referencing or copying `portal-web` views, CSS, services, or internal test fixtures. It must not offer screenshot baselines that imply portal-web pixel parity.
- **Reference-host sample:** add a private sample Razor Class Library under the SDK test projects with one controller/view/static asset and one nav/profile/dashboard/settings contribution. Use it only to prove the testing package itself.
- **CI runner contract:** do not rely on `FullyQualifiedName~IntegrationTests` alone. Run `XtremeIdiots.Portal.FeatureSdk.Web.IntegrationTests.csproj` directly, install Chromium first, write a TRX result, and fail the job when `ResultSummary/Counters/@total` is `0`. Before the SDK publish gate, update `frasermolyneux/actions/dotnet-playwright-tests` (publish a new immutable version) to accept an exact `test-project` input and enforce those install/direct-run/non-zero semantics; feature repositories consume that version.

**Acceptance (1.6):**
- A sample `IServerEventHandler` and a sample `INavigationContributor` can be unit-tested with only the `.Testing` packages.
- The sample RCL launches on a random loopback port and Chromium proves its route, static asset, contributor rendering, anonymous/allowed/denied visibility, and settings POST→GET round-trip.
- A deliberately triggered console error, HTTP 500, failed same-origin request, and external request each fail with useful diagnostics.
- Two role/browser contexts do not share authentication or storage state; host and browser dispose cleanly.

---

## 1.7 — Unit tests

Cover at minimum:
- **Pipeline:** ordering across bands; deterministic tie-break; `SupportedGames` filtering; **every** matching handler runs (no short-circuit); handler exceptions propagate.
- **Connection orchestration:** collaborators run in the fixed order; the greeter is **skipped** when the guard sets `GuardWasDestructive`; no-op defaults resolve when a collaborator is absent; the `IpIntelligenceDto` set by the enricher is visible to the guard + greeter.
- **JobRunner:** `RunAsync` by name; `RunSetAsync` orders by `Phase` then `Order`; `IJobTelemetry` wrapping when present.
- **GameScope.Supports:** empty = all; membership; non-member excluded.
- **StructuralPermissionValidator.IsWellFormed:** valid `{Domain}.{Action}` + GameType/GUID value pass; malformed shapes and bad values fail.
- **StructuralSettingsValidator.IsWellFormed:** well-formed JSON + non-empty namespace pass; malformed JSON / empty namespace fail.
- **FeatureSettingsResolver:** per-server override wins over global; global wins over built-in default; missing both returns the default; deserialisation into the contract type.
- **Dependency assertion:** `AddPortalFeatureCore()` throws a clear, service-named error when an always-required prerequisite (`IRepositoryApiClient` / `IMemoryCache` / `IAuditLogger`) is absent; `AddPortalFeatureRcon()` throws when `IServersApiClient` is absent; `AddPortalFeatureCore()` alone does **not** require `IServersApiClient` (the timer-host case).
- **FeatureCache:** L0 request de-dupe; L1 TTL expiry; concurrent `GetOrAddAsync` calls the factory once.
- **RconGateway:** each `GameType` routes to the correct `IServersApiClient` sub-client (mock the client); `Supports` matrix.
- **Registries:** duplicate namespace / duplicate claim type throw.
- **Web:** nav builder filters by policy (stub `IAuthorizationService`) and game; profile-block/dashboard runners order + filter.
- **Web reference host:** sample RCL discovery; controller/view/static-asset serving; navigation/profile/dashboard/settings rendering; global/per-server settings round-trip; principal/policy isolation; browser diagnostic capture.

**Validate (1.3–1.7):**
```pwsh
dotnet build src/XtremeIdiots.Portal.FeatureSdk.sln
dotnet test  src/XtremeIdiots.Portal.FeatureSdk.sln --filter "FullyQualifiedName!~IntegrationTests"
dotnet test  src/XtremeIdiots.Portal.FeatureSdk.Web.IntegrationTests/XtremeIdiots.Portal.FeatureSdk.Web.IntegrationTests.csproj --results-directory TestResults --logger "trx;LogFileName=playwright.trx"
# The CI action installs Chromium and fails unless TestResults/playwright.trx reports Counters.total > 0.
dotnet format src/XtremeIdiots.Portal.FeatureSdk.sln --verify-no-changes
```

---

## 1.8 — Publish gate (hard stop)

**Do:** Get the four packages published to **NuGet.org** at `0.1.x` via the standard flow: merge to `main` → `Release - Version and Tag` tags `v0.1.x` → `Release - Publish NuGet` pushes to NuGet.org (`NUGET_API_KEY`, `NuGet` environment). The requester performs/reviews the merge + publish (git write ops are theirs).

**Acceptance / gate:**
- `XtremeIdiots.Portal.FeatureSdk`, `.Web`, `.Testing`, `.Web.Testing` are visible on NuGet.org at `0.1.x`.
- A **scratch console app** restores `XtremeIdiots.Portal.FeatureSdk` and calls `AddPortalFeatureCore()` against fake clients without error.
- A **scratch Razor Class Library test project** restores `FeatureSdk.Web.Testing`, launches the reference host with its assembly, and loads one controller route in Chromium without referencing `portal-web`.

**STOP.** Do not start [part-2-integration.md](part-2-integration.md) until this gate passes. This is the NuGet dependency gate — no cross-repo project references to bridge it.

---

## Part 1 definition of done

- [ ] `portal-feature-sdk` provisioned, scaffolded (library repo), CI green.
- [ ] `FeatureSdk` (contracts + infra) and `FeatureSdk.Web` build; `.Testing` companions build.
- [ ] Unit tests cover pipeline, jobs, cache, RCON routing, structural validation, registries, web filtering.
- [ ] Reference-host integration tests prove an RCL route, contributors, authorization, settings round-trip, static assets, browser isolation, and diagnostic capture in Chromium.
- [ ] The versioned Playwright action targets an explicit test project, installs Chromium, publishes TRX, and fails when zero tests execute; the SDK CI uses it.
- [ ] `dotnet format --verify-no-changes` clean.
- [ ] Packages published to NuGet.org `0.1.x` and restorable by a scratch project.
- [ ] `code-review` sub-agent run; High/Medium findings resolved.

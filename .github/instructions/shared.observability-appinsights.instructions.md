---
description: Consumption contract for observability-appinsights — telemetry filtering, audit logger, job telemetry NuGet packages.
applyTo: '**/*.cs,**/*.csproj,**/appsettings*.json'
---
# observability-appinsights — Consumer Contract

Provides three .NET NuGet packages that wire Application Insights telemetry filtering, structured audit logging, and scheduled-job telemetry into ASP.NET Core / Worker Service / Functions Isolated apps.

## Packages

| Package | Audience |
|---|---|
| `MX.Observability.ApplicationInsights` | Core types (filter processor, audit logger, job telemetry); rarely consumed directly |
| `MX.Observability.ApplicationInsights.AspNetCore` | ASP.NET Core / API host adapter — `AddObservability()` wires AddApplicationInsightsTelemetry + filter + audit + jobs |
| `MX.Observability.ApplicationInsights.WorkerService` | Worker Service / Functions Isolated adapter |

Targets `net9.0` and `net10.0`.

## DI registration — ASP.NET Core

```csharp
using MX.Observability.ApplicationInsights.AspNetCore;

builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddObservability();

// or with custom filter thresholds:
builder.Services.AddObservability(opts =>
{
    opts.Dependencies.DurationThresholdMs = 2000;
    opts.Traces.MinSeverity = "Information";
});
```

## DI registration — Worker / Functions Isolated

```csharp
using MX.Observability.ApplicationInsights.WorkerService;

builder.Services.AddApplicationInsightsTelemetryWorkerService();
builder.Services.AddObservability();
```

## Configuration

Bound from `ApplicationInsights:TelemetryFilter:*` (optional; sensible defaults provided):

| Key | Default | Notes |
|---|---|---|
| `Enabled` | `true` | Master toggle |
| `Dependencies.Enabled` | `true` | Filter dependency telemetry |
| `Dependencies.DurationThresholdMs` | `1000` | Drop dependencies faster than this |
| `Requests.Enabled` | `true` | Filter request telemetry |
| `Requests.DurationThresholdMs` | `1000` | Drop requests faster than this |
| `Requests.ExcludedPaths` | `/healthz,/health,/api/health` | Drop these paths regardless of duration |
| `Requests.RetainedStatusCodeRanges` | `400-599` | Always keep these status codes |
| `Traces.Enabled` | `true` | Filter trace telemetry |
| `Traces.MinSeverity` | `Warning` | Drop traces below this severity |

App Insights connection string comes from the standard `APPLICATIONINSIGHTS_CONNECTION_STRING` env var or `ApplicationInsights:InstrumentationKey` config key.

## Public APIs

### `IAuditLogger` — structured audit events

```csharp
public class AdminService(IAuditLogger audit, ICurrentUser user)
{
    public async Task CreatePlayerAsync(string playerId, string username)
    {
        audit.LogAudit(
            AuditEvent.UserAction("PlayerCreated", AuditAction.Create)
                .WithActor(user.Id, user.Name)
                .WithTarget(playerId, "Player")
                .WithSource("AdminActions")
                .Build());
        // ...
    }
}
```

Event categories:
- `AuditEvent.UserAction(name, action)` — user-initiated
- `AuditEvent.ServerAction(name, action)` — server/game-driven
- `AuditEvent.SystemAction(name, action)` — background/system

Builder methods: `.WithActor(...)`, `.WithTarget(...)`, `.WithSource(...)`, `.WithGameContext(...)`, `.WithProperties(...)`, `.Build()`.

### `IJobTelemetry` — scheduled job lifecycle tracking

```csharp
public class DataSyncJob(IJobTelemetry telemetry)
{
    public Task<int> RunAsync() =>
        telemetry.ExecuteAsync("MapImageSync", async () =>
        {
            var count = await ProcessImages();
            return count;
        });
}
```

Or explicit:

```csharp
var job = telemetry.StartJob("MapImageSync");
try
{
    var count = await ProcessImages();
    job.Complete(new { count });
}
catch (Exception ex)
{
    job.Fail(ex);
    throw;
}
```

### `ITelemetryFilterProcessor`

Wired automatically by `AddObservability()`. Filters telemetry per the configuration above. Custom thresholds via the lambda overload.

## Granular registration (rarely used)

```csharp
services.AddObservabilityCore();   // No telemetry processor wiring
services.AddAuditLogging();        // Audit logger only
services.AddJobTelemetry();        // Job telemetry only
```

Use only when integrating piecewise into an existing telemetry pipeline.

## Testing

No dedicated `*.Testing` package — `IAuditLogger` and `IJobTelemetry` are mockable via the standard interface-mock approach (Moq, NSubstitute).

## Cross-references

- `platform.monitoring.instructions.md` — central Log Analytics workspace receiving the telemetry
- `standards.dotnet-project.instructions.md` — project file conventions

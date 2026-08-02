# Phase 1 Part 2 Implementation Evidence

## Deployment

Status: **fully deployed to production**

- Workflow run: `30704288423`.
- Commit: `1a756b2205eb109c2e33a02dbf738c29dceb7623`.
- Workflow started: `2026-08-01T14:41:12Z`.
- Workflow completed: `2026-08-01T15:00:41Z`.
- Production deployment jobs:
  - `eastus`: started `2026-08-01T14:57:28Z`, succeeded by `2026-08-01T15:00:40Z`.
  - `uksouth`: started `2026-08-01T14:58:26Z`, succeeded by `2026-08-01T15:00:40Z`.
  - `westeurope`: started `2026-08-01T14:59:34Z`, succeeded by `2026-08-01T15:00:40Z`.
- All three Function Apps reported `Running` on the .NET 9 isolated runtime after deployment.

### Governance exception

The production deployment occurred while the governing Phase 0 README still prohibited Phase 1 deployment until both Phase 0 parts passed. Phase 0 Part 2 remains open because the terminal failure path can emit an expanded URI and response body and can place the expanded URI in the exception.

Phase advancement is halted. Read-only validation and measurement may continue, but no further deployment, controlled-failure exercise, Part 2 exit, or later phase may proceed until Phase 0 Part 2 passes or the governing gate is formally changed with an approved rationale.

## Immediate production checkpoint

Checkpoint status: **passed, first observation only**

- Clean post-deployment boundary: `2026-08-01T15:03:00Z`.
- Boundary rationale: 100 routine lifecycle rows from the previous deployment were ingested for `westeurope` between `15:02:00Z` and `15:02:30Z`. No routine rows were present from `15:03:00Z` onward.
- Observation window: `2026-08-01T15:03:00Z` inclusive to `2026-08-01T15:15:00Z` exclusive.
- The required observation across the first two 30-minute alert windows remains pending until at least `2026-08-01T16:03:00Z`.

### Regional execution and routine suppression

Function trace records are sampled and are used only to confirm that each host resumed and completed work:

| Region       | Sampled `FunctionStarted` traces | Sampled `FunctionCompleted` traces | Routine lifecycle rows after `15:03Z` |
| ------------ | -------------------------------: | ---------------------------------: | ------------------------------------: |
| `eastus`     |                               14 |                                 14 |                                     0 |
| `uksouth`    |                               17 |                                 17 |                                     0 |
| `westeurope` |                               15 |                                 15 |                                     0 |

Structured availability is unsampled and provides the authoritative execution reconciliation. Every execution produced one result for each of the 13 configured checks:

| Region       | Availability results | Configured checks | Authoritative executions |
| ------------ | -------------------: | ----------------: | -----------------------: |
| `eastus`     |                  312 |                13 |                       24 |
| `uksouth`    |                  299 |                13 |                       23 |
| `westeurope` |                  299 |                13 |                       23 |

### Protected telemetry

- Retry warnings: none naturally occurred during this short checkpoint.
- Terminal errors: none occurred.
- Exporter errors: none occurred.
- SiteWatch exceptions: none occurred.
- HTTP dependency spans: 454 total, 454 successful, zero failed.
- Dependency completeness: zero missing result codes, zero missing durations, and zero non-positive durations in every region.

| Region       | Dependencies | Failed | p50 ms  | p95 ms  | p99 ms  |
| ------------ | -----------: | -----: | ------: | ------: | ------: |
| `eastus`     |          138 |      0 | 193.088 | 434.241 | 500.061 |
| `uksouth`    |          166 |      0 | 115.111 | 345.856 | 669.148 |
| `westeurope` |          150 |      0 | 104.226 | 392.695 | 940.659 |

### Structured availability

Native availability remained current for all 13 configured components across the expected destinations and regions.

| Destination                                 | Results | Successful | Failed | Locations | Components |
| ------------------------------------------- | ------: | ---------: | -----: | --------: | ---------: |
| `ai-geo-location-prd-swedencentral`         |     140 |        140 |      0 |         3 |          2 |
| `ai-platform-sitewatch-func-prd-eastus`     |     120 |        120 |      0 |         1 |          5 |
| `ai-platform-sitewatch-func-prd-uksouth`    |     115 |        115 |      0 |         1 |          5 |
| `ai-platform-sitewatch-func-prd-westeurope` |     115 |        115 |      0 |         1 |          5 |
| `ai-portal-core-prd-uksouth`                |     420 |        420 |      0 |         3 |          6 |
| **Total**                                   | **910** |    **910** |  **0** |           |            |

### Metric and alert inputs

From `2026-08-01T15:03:00Z` to `2026-08-01T15:15:00Z`:

| Destination                                 | Availability percentage | Buckets | Count min | Count max | Count sum | Partial buckets |
| ------------------------------------------- | ----------------------: | ------: | --------: | --------: | --------: | --------------: |
| `ai-platform-sitewatch-func-prd-eastus`     |                    100% |      12 |        10 |        10 |       120 |               0 |
| `ai-platform-sitewatch-func-prd-uksouth`    |                    100% |      12 |         5 |        10 |       115 |               1 |
| `ai-platform-sitewatch-func-prd-westeurope` |                    100% |      12 |         5 |        10 |       115 |               1 |
| `ai-portal-core-prd-uksouth`                |                    100% |      12 |        24 |        36 |       420 |               1 |
| `ai-geo-location-prd-swedencentral`         |                    100% |      12 |         8 |        12 |       140 |               1 |

The first bucket is partial for four destinations because their first post-boundary results occurred at `15:03:30Z`; the metric count sums reconcile exactly to the 910 structured availability rows.

### Alert reconciliation

Terraform plans one alert per production availability test: 13 planned alerts. An unfiltered Azure Resource Graph query found 10 matching alert resources: all 10 are enabled and none are disabled. The remaining three planned rows are absent rather than deployed-but-disabled. The production workflow's Terraform apply action was skipped because this release contained no Terraform change, so the existing drift was not reconciled by the application deployment.

| Logical check | Alert dimension value | Exact Application Insights scope | Planned severity / action group | Deployed state | Dimension metric input |
| ------------- | --------------------- | -------------------------------- | ------------------------------- | -------------- | ---------------------- |
| Portal repository API v1 | `app-portal-repo-prd-uksouth-v1-655b79d54d89` | `ai-portal-core-prd-uksouth` | Critical / P0 | Enabled | 12 one-minute buckets at 100% |
| Portal repository API v2 | `app-portal-repo-prd-uksouth-v2-655b79d54d89` | `ai-portal-core-prd-uksouth` | Critical / P0 | Enabled | 12 one-minute buckets at 100% |
| Portal repository function | `fn-portal-repository-func-prd-uksouth-ad4109a900bb` | `ai-portal-core-prd-uksouth` | High / P1 | Enabled | 12 one-minute buckets at 100% |
| Portal servers integration | `app-portal-servers-int-prd-uksouth-v1-66febf7b1b9d` | `ai-portal-core-prd-uksouth` | High / P1 | Enabled | 12 one-minute buckets at 100% |
| Portal sync | `fn-portal-sync-func-prd-uksouth-50d011333089` | `ai-portal-core-prd-uksouth` | Critical / P0 | Enabled | 12 one-minute buckets at 100% |
| Portal web | `app-portal-web-prd-uksouth-fe584e15256a` | `ai-portal-core-prd-uksouth` | Critical / P0 | Enabled | 12 one-minute buckets at 100% |
| Geo-location API | `app-geo-location-api-prd-swedencentral-6f10eaac01a0` | `ai-geo-location-prd-swedencentral` | High / P1 | Enabled | 12 one-minute buckets at 100% |
| Geo-location web | `app-geo-location-web-prd-swedencentral-6f10eaac01a0` | `ai-geo-location-prd-swedencentral` | High / P1 | Enabled | 12 one-minute buckets at 100% |
| Forums web | `www.xtremeidiots.com-web` | `ai-platform-sitewatch-func-prd-uksouth` | Critical / P0 | **Missing** | No deployed alert criterion |
| Forums tasks | `www.xtremeidiots.com-tasks` | `ai-platform-sitewatch-func-prd-uksouth` | High / P1 | **Missing** | No deployed alert criterion |
| Redirect | `redirect.xtremeidiots.net` | `ai-platform-sitewatch-func-prd-uksouth` | High / P1 | **Missing** | No deployed alert criterion |
| Bishops Bees | `bishopbees.co.uk` | `ai-platform-sitewatch-func-prd-uksouth` | Critical / P0 | Enabled | 12 one-minute buckets at 100% |
| Molyneux.me | `molyneux.me` | `ai-platform-sitewatch-func-prd-uksouth` | Low / P3 | Enabled | 12 one-minute buckets at 100% |

All 10 deployed alerts use `availabilityResults/availabilityPercentage`, a one-minute evaluation frequency, a 30-minute window, and a `StartsWith` operator on `availabilityResult/name`. Equality-filtered metric probes for each listed dimension value proved that the intended series was live throughout the frozen checkpoint; the probes do not replace or claim to duplicate the deployed `StartsWith` criterion semantics.

The missing forums web, forums tasks, and redirect alerts are a pre-existing source/deployment drift and block the alert-inventory portion of the Part 2 exit gate. Do not create them as part of this read-only checkpoint; reconcile them through the owning Terraform workflow after the Phase 0 governance gate is resolved.

## Reproducible query definitions

Workspace queries use:

- Workspace: `log-platform-monitoring-prd-uksouth`.
- Resource group: `rg-platform-monitoring-prd-uksouth`.
- Query API start: `2026-08-01T15:03:00Z`.
- Query API end: `2026-08-01T15:15:00Z`.
- The same start-inclusive/end-exclusive boundaries are repeated in every KQL query.

### Regional executions

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
AppTraces
| where TimeGenerated >= start and TimeGenerated < end
| where AppRoleName startswith_cs "fn-platform-sitewatch-func-prd-"
| extend Resource=tostring(split(_ResourceId,"/")[-1]), Event=tostring(Properties["EventName"])
| summarize FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated), Rows=count(),
    FunctionStarts=countif(Event=="FunctionStarted"),
    FunctionCompletes=countif(Event=="FunctionCompleted") by Resource, AppRoleName
| order by Resource asc
```

### Routine lifecycle suppression

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
let routine=dynamic(["RequestPipelineStart","RequestStart","RequestEnd","RequestPipelineEnd"]);
AppTraces
| where TimeGenerated >= start and TimeGenerated < end
| where AppRoleName startswith_cs "fn-platform-sitewatch-func-prd-"
| extend Resource=tostring(split(_ResourceId,"/")[-1]), Event=tostring(Properties["EventName"])
| summarize RoutineRows=countif(Event in (routine)), LastRoutine=maxif(TimeGenerated, Event in (routine)), TotalRows=count() by Resource
| order by Resource asc
```

### Protected trace signals

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
AppTraces
| where TimeGenerated >= start and TimeGenerated < end
| where AppRoleName startswith_cs "fn-platform-sitewatch-func-prd-"
    or (AppRoleName == "Sitewatch FuncApp" and _ResourceId has_cs "/ai-platform-sitewatch-func-prd-")
| extend Resource=tostring(split(_ResourceId,"/")[-1]), LoggerCategory=coalesce(tostring(Properties["CategoryName"]), tostring(Properties["Category"]))
| extend Signal=case(
    SeverityLevel==2 and Message startswith "Request retry ", "RetryWarning",
    SeverityLevel==3 and Message startswith "Availability check failed ", "AvailabilityTerminalError",
    SeverityLevel==3 and Message startswith "Failed to get a successful response ", "HttpTerminalError",
    LoggerCategory has "Exporter" and SeverityLevel>=2, "ExporterError",
    SeverityLevel>=3, "OtherError",
    "Other")
| where Signal != "Other"
| summarize Rows=count(), FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated) by Resource, Signal, SeverityLevel, LoggerCategory
| order by Resource asc, Signal asc
```

### HTTP dependencies

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
AppDependencies
| where TimeGenerated >= start and TimeGenerated < end
| where AppRoleName == "Sitewatch FuncApp" and _ResourceId has_cs "/ai-platform-sitewatch-func-prd-"
| extend Resource=tostring(split(_ResourceId,"/")[-1])
| summarize FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated), Total=count(),
    Failed=countif(Success==false), Succeeded=countif(Success==true), StatusCodes=dcount(ResultCode),
    MissingResultCodes=countif(isempty(ResultCode)), MissingDurations=countif(isnull(DurationMs)),
    NonPositiveDurations=countif(DurationMs <= 0),
    P50Ms=round(percentile(DurationMs,50),3), P95Ms=round(percentile(DurationMs,95),3),
    P99Ms=round(percentile(DurationMs,99),3) by Resource
| order by Resource asc
```

### Structured availability

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
AppAvailabilityResults
| where TimeGenerated >= start and TimeGenerated < end
| where _ResourceId has_any (
    "/ai-platform-sitewatch-func-prd-",
    "/ai-portal-core-prd-uksouth",
    "/ai-geo-location-prd-swedencentral")
| extend Destination=tostring(split(_ResourceId,"/")[-1])
| summarize FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated), Results=count(),
    Successful=countif(Success==true), Failed=countif(Success==false),
    Locations=dcount(Location), Components=dcount(tostring(Properties["component"])) by Destination
| order by Destination asc
```

### Authoritative executions by region

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
AppAvailabilityResults
| where TimeGenerated >= start and TimeGenerated < end
| where _ResourceId has_any (
    "/ai-platform-sitewatch-func-prd-",
    "/ai-portal-core-prd-uksouth",
    "/ai-geo-location-prd-swedencentral")
| summarize Results=count(), Components=dcount(tostring(Properties["component"])),
    Destinations=dcount(tostring(split(_ResourceId,"/")[-1])),
    FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated) by Location
| extend ExpectedChecks=13, Executions=Results / 13.0
| order by Location asc
```

### Exceptions

```kusto
let start=datetime(2026-08-01T15:03:00Z);
let end=datetime(2026-08-01T15:15:00Z);
AppExceptions
| where TimeGenerated >= start and TimeGenerated < end
| where AppRoleName startswith_cs "fn-platform-sitewatch-func-prd-"
    or (AppRoleName == "Sitewatch FuncApp" and _ResourceId has_cs "/ai-platform-sitewatch-func-prd-")
| extend Resource=tostring(split(_ResourceId,"/")[-1])
| summarize Exceptions=count(), FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated) by Resource, ExceptionType
| order by Resource asc, Exceptions desc
```

### Metric requests

Run one request per destination resource with:

- Start: `2026-08-01T15:03:00Z`.
- End: `2026-08-01T15:15:00Z`.
- Namespace: `microsoft.insights/components`.
- Interval: `PT1M`.
- Maximum buckets: 50.
- No dimension filter for this destination-level checkpoint.

Destinations:

| Subscription | Resource group | Resource |
| ------------ | -------------- | -------- |
| Platform management | `rg-platform-sitewatch-func-prd-eastus` | `ai-platform-sitewatch-func-prd-eastus` |
| Platform management | `rg-platform-sitewatch-func-prd-uksouth` | `ai-platform-sitewatch-func-prd-uksouth` |
| Platform management | `rg-platform-sitewatch-func-prd-westeurope` | `ai-platform-sitewatch-func-prd-westeurope` |
| Portal production | `rg-portal-core-prd-uksouth` | `ai-portal-core-prd-uksouth` |
| Platform shared | `rg-geo-location-prd-swedencentral` | `ai-geo-location-prd-swedencentral` |

Metrics:

- `availabilityResults/availabilityPercentage` with `Average` aggregation.
- `availabilityResults/count` with `Count` aggregation.

For each deployed alert route, repeat the percentage request with an OData equality filter selecting its intended series:

```text
availabilityResult/name eq '<deployed alert dimension value>'
```

The frozen checkpoint returned one equality-filtered series with 12 one-minute buckets at 100% for each of the 10 enabled alert dimension values. The deployed criterion operator remains `StartsWith` and is recorded separately in the alert inventory.

### Alert inventory

Run this Azure Resource Graph query across all subscriptions:

```kusto
resources
| where type =~ "microsoft.insights/metricalerts"
| mv-expand scope=properties.scopes
| extend Scope=tostring(scope)
| where Scope has_any (
    "/ai-platform-sitewatch-func-prd-eastus",
    "/ai-platform-sitewatch-func-prd-uksouth",
    "/ai-platform-sitewatch-func-prd-westeurope",
    "/ai-portal-core-prd-uksouth",
    "/ai-geo-location-prd-swedencentral")
| mv-expand criterion=properties.criteria.allOf
| extend MetricName=tostring(criterion.metricName)
| where MetricName in ("availabilityResults/availabilityPercentage", "availabilityResults/count")
| project AlertName=name, Scope, Enabled=tobool(properties.enabled),
    Severity=toint(properties.severity),
    EvaluationFrequency=tostring(properties.evaluationFrequency),
    WindowSize=tostring(properties.windowSize),
    MetricNamespace=tostring(criterion.metricNamespace),
    MetricName,
    Dimensions=criterion.dimensions,
    Actions=properties.actions
| order by Scope asc, AlertName asc
```

## Pending gates

- Repeat the immediate queries after two complete 30-minute alert windows, no earlier than `2026-08-01T16:03:00Z`.
- Governing-gate exception: deployment occurred while Phase 0 Part 2 remained open. Read-only evidence collection may continue, but phase advancement is halted.
- Alert-inventory drift: 13 alerts are planned and 10 are deployed; forums web, forums tasks, and redirect are missing.
- The current production configuration has no dedicated non-customer synthetic failure route. Do not intentionally fail a customer endpoint.
- **Controlled-failure blocker:** the deployed terminal non-success path still logs the expanded URI and response body, then places the expanded URI in the thrown exception. This violates the unresolved [Phase 0 Part 2](../telemetry-cost-optimisation-phase-0/part-2-remediate-failing-probe.md) safety gate.
- Do not run either a production or dev controlled failure until Phase 0 Part 2 removes expanded URI/body data from logs and exceptions, secret-scanning tests pass, and any potentially exposed credential rotation is confirmed by its owner.
- After that gate passes, use the documented dev synthetic fallback only with an explicitly agreed bounded failure and unconditional cleanup procedure.
- First three-day complete-window comparison becomes available at `2026-08-05T00:00:00Z`.
- Final four-day comparison becomes available at `2026-08-06T00:00:00Z`.

## Rollback status

Rollback remains available: remove `ConfigureLogging(SiteWatchHttpClient.ConfigureLogging)` and redeploy. No rollback was indicated by this first checkpoint.
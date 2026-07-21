# Target Telemetry Policy

This is the target contract for telemetry feeding the shared production workspace. It balances alerting, audit, exception diagnosis, and performance monitoring against ingestion cost. Phase 5 turns the proven contract into org guidance and shared defaults.

## Signal matrix

| Signal                             | Target handling    | Sampling/filtering rule                                                                              | Required consumer/evidence                                                                                |
| ---------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Audit/security event               | Retain             | 100%; bypass generic severity and sampling filters                                                   | Audit queries, incident response, or compliance purpose documented.                                       |
| Exception                          | Retain             | 100%                                                                                                 | Exception triage and alerting.                                                                            |
| Failed request                     | Retain             | 100%; retain HTTP 4xx/5xx ranges unless a specific expected status is separately classified          | Failure alert, troubleshooting, and rate calculation.                                                     |
| Failed dependency                  | Retain             | 100%; retain agreed transient/limit result codes such as 429/503                                     | Dependency failure and saturation diagnosis.                                                              |
| Slow request/dependency            | Retain             | 100% above an app-owned threshold                                                                    | Performance regression diagnosis and latency SLO.                                                         |
| Successful fast request/dependency | Reduce             | Filter at source or sample using the shared package                                                  | Retain enough canonical observations for traffic and latency trends; exemptions require a named consumer. |
| Health/live/ready request          | Reduce             | Filter routine success; retain failure and associated exception                                      | Resource health/metric alert remains authoritative.                                                       |
| Structured availability result     | Retain             | 100%; one result per check execution with success, duration, location, target, and sanitised message | Reconciled availability alerts and availability reporting.                                                |
| SiteWatch retry                    | Retain as warning  | One warning per retry with attempt, exception/status class, and delay; no URL/query/body             | Operational diagnosis.                                                                                    |
| SiteWatch terminal failure         | Retain as error    | One error plus exception/status class and sanitised endpoint identifier; no secret-bearing values    | Incident diagnosis and alert corroboration.                                                               |
| SiteWatch successful lifecycle     | Drop               | Suppress framework request-start/send/headers/end logs below `Warning`                               | Structured availability + dependency span replace textual lifecycle logs.                                 |
| SiteWatch recovery                 | Retain             | Emit a transition event when a previously failing logical check succeeds                             | Incident closure and flapping analysis.                                                                   |
| Custom metric                      | Retain selectively | One canonical measurement or counter; derive rate/min/max/average in Azure Monitor                   | Named alert, workbook, dashboard, SLO, or capacity decision.                                              |
| Debug/verbose trace                | Drop in production | Disabled unless time-boxed for an incident                                                           | Incident ticket and automatic expiry/rollback.                                                            |
| Informational business/job event   | Selective          | Retain start/failure/completion when it is a job/audit contract; remove per-item success chatter     | Named operational workflow.                                                                               |

## Shared implementation boundaries

### OpenTelemetry applications

The `MX.Observability.OpenTelemetry` packages own common filtering:

- `TracingFilterProcessor` filters successful, fast server/client/producer/consumer activities.
- `LogRecordFilterProcessor` filters below `OpenTelemetry:Filtering:Logs:MinSeverity`, supports category exclusions/retentions, and always retains records marked `Audit.IsAuditEvent`.
- App repos configure thresholds and stable category exclusions. They do not add a second custom processor unless the shared abstraction cannot represent a proved requirement.

### Application Insights SDK applications

The `MX.Observability.ApplicationInsights` packages own common filtering:

- `TelemetryFilterProcessor` filters successful-fast dependencies and requests, low-severity traces, and optional custom-event allow-lists.
- App repos configure `ApplicationInsights:TelemetryFilter` thresholds and exclusions.
- Audit `EventTelemetry` must remain allowed. Before enabling a custom-event allow-list, include the shared audit event names/prefixes and test them.

### SiteWatch

`platform-sitewatch-func` owns its multi-target availability routing and probe-specific logging. The shared OpenTelemetry availability package owns the single-result shape. The implementation must establish an integration test or deployed smoke test for the Azure Monitor conversion boundary; unit tests that only assert in-memory routing are insufficient.

## Default thresholds and overrides

The shared libraries currently default successful-fast request/dependency thresholds to 1,000 ms and logs/traces to `Warning`. Treat these as pilot starting points, not immutable policy:

- Keep thresholds configuration-driven and live-reloadable where the host already supports it.
- Set thresholds from observed p95/p99 and SLOs; do not choose them solely to maximize reduction.
- Always retain failure/error status and configured result-code ranges before applying duration logic.
- Document every app override with the workload characteristic that requires it.

## Sampling pipeline invariant

"Retain 100%" applies across the complete path, not only the shared filter processor. For every host, inventory and test the effective order and configuration of SDK/adaptive/fixed sampling, OpenTelemetry samplers/processors, Functions `host.json` sampling, exporter behavior, Application Insights resource ingestion sampling, and any workspace transformation. Audit/security events, exceptions, failed and slow operations, and structured availability must bypass every applicable sampling stage. A unit test showing that the shared filter retained an item is necessary but not sufficient; the pilot also needs end-to-end destination evidence.

## Rollout and rollback

1. Establish aggregate baseline and signal consumers.
2. Add characterization/unit tests around filter precedence and protected signals.
3. Apply in dev and run controlled success/failure/slow-call probes.
4. Pilot one production scope where technically possible.
5. Compare equal complete-day windows.
6. Expand only after alert, audit, exception, failure, and performance evidence passes.

Rollback must be a configuration reversal wherever the shared package already supports the setting. A code rollback is acceptable for the SiteWatch category filter or emitter correction, but the phase must document the exact prior setting/version.

## Prohibited approaches

- Blanket workspace-wide percentage reduction without telemetry-class controls.
- Sampling or filtering audit, security, exception, failure, or availability data.
- Dropping successful dependency/request data before confirming how traffic and latency trends will be retained.
- Filtering solely on free-form message text when category, telemetry type, status, duration, path, or target is available.
- Logging full probe URLs, query strings, token substitutions, response bodies, or credentials.
- Removing a metric because it appears derivable without proving its alerts/workbooks/dashboards use the replacement.
- Reducing SiteWatch region count as a cost shortcut.
- Combining projected savings from overlapping phases.

## Required per-repository validation

- .NET: repo VS Code build and format tasks when available; otherwise `dotnet build`, relevant tests, and `dotnet format --verify-no-changes`.
- Terraform: `terraform fmt -check -recursive`, `terraform validate`, and an intentional dev plan when deployable resources/settings change.
- SiteWatch: unit tests, structured-availability integration/smoke evidence, controlled alert fire/recovery, and aggregate ingestion comparison.
- Front-end/browser validation is not required unless a touched repo exposes telemetry settings through a UI.
- Run the `code-review` sub-agent and resolve High/Medium findings before completion.
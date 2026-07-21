# Evidence, Measurement & Safety Gates

This document is the sanitised evidence ledger for the work package. It intentionally excludes raw URLs, query strings, tokens, response bodies, and message payloads. Re-run aggregate queries at phase execution time; do not treat these values as permanent facts.

## Baseline captured 20 July 2026

Read-only queries against `log-platform-monitoring-prd-uksouth` covered the preceding 30 days unless noted otherwise.

| Observation | Result | Confidence / caveat |
| --- | ---: | --- |
| Total billable ingestion | approximately 51.8 GB | High; rounded from the workspace `Usage` table. |
| `AppTraces` | 31.605 GB (approximately 61%) | High. |
| Four routine SiteWatch `HttpClient` lifecycle messages | 18.0325 GB | High; reproducible aggregate predicate and entirely attributed to SiteWatch roles. This is a historical ceiling, not a forward saving. |
| `AppMetrics` | 4.8156 GB | High. |
| Mapped metric series | 4.1035 GB across 70 series | High for the mapped rows. The 0.7121 GB residual was not explained and must not be included in a savings estimate without fresh attribution. |
| Workspace-based Application Insights resources | 10 components across 4 accessible subscriptions | High for resources visible to the investigating identity. |
| Enabled availability alerts | 10 | High. All use `availabilityResults/availabilityPercentage`, one-minute evaluation, and a 30-minute window. Their destinations split 6/2/2 across portal-core, SiteWatch, and geo-location Application Insights resources. |
| SiteWatch availability rows after 17 July | exactly 0 in `AppAvailabilityResults` | High for the queried workspace/table and interval. |
| SiteWatch traces after 17 July | present through 20 July | High; proves the function continued executing and exporting at least trace telemetry. |
| Availability metric query | no time series returned from any of the 3 alert destinations over 24-hour and 7-day windows | Medium. An empty API response is not the same as a returned zero, but it is inconsistent with healthy alert input when combined with the workspace result. |
| Existing availability history | one unrelated historical stream, last seen 23 June | High; does not establish SiteWatch health. |
| Permanently failing probe | repeated in all three regions with `Invalid Task Method` | High from grouped trace evidence. The endpoint itself is deliberately not recorded here. |
| Sensitive URL shape | a key-bearing query string appeared in failure logging | High. Treat the credential as exposed and rotate it; do not reproduce its value. |

## Change-point caveat

The baseline includes a material transition on 17 July:

- A legacy SiteWatch role fell sharply around 07:15 UTC and stopped producing normal volume around 07:30 UTC.
- Regional SiteWatch roles continued at their prior band.
- Portal APIM telemetry changed roughly three hours later, so it was not one workspace-wide sampling event.
- Correlation, timestamp, instance, SDK, and message-shape checks did not support treating the legacy and regional SiteWatch streams as duplicate exported records.

Consequences:

1. The 18.0325 GB routine-trace figure is a historical upper bound.
2. Use a fresh post-transition baseline before implementing Phase 1.
3. Never add projected savings from Phases 1–3; they reduce overlapping SiteWatch events.

## Protected signals

No phase may intentionally reduce the following without an explicit specification change:

- Structured availability success/failure/duration and run location.
- Availability alert metric series and controlled alert transitions.
- Exceptions and unhandled failures.
- Failed requests and dependencies, including retained response/result codes.
- Slow requests/dependencies above the application threshold.
- SiteWatch retry warnings, terminal failures, and recovery transitions.
- Audit and security events, including their actor/target/correlation fields where policy permits.
- Deployment/version verification and health alert inputs.

Routine successful framework logs are not protected merely because they can aid ad hoc debugging. Preserve dependency spans and structured check results instead of four textual lifecycle messages per request.

## Measurement protocol

Every implementation part that changes telemetry must capture this evidence in its PR or implementation log.

### Before change

1. Use complete UTC days after the 17 July transition; do not compare partial days.
2. Record billable GB/day and row count by `DataType`, application role, and relevant safe classifier.
3. Record exception, failed request, failed dependency, audit-event, and availability counts.
4. Record p50/p95/p99 duration where performance telemetry is affected.
5. Export the enabled alert inventory and identify every alert/workbook/dashboard consuming the changed signal.

### After change

1. Allow exporter/ingestion delay, then compare at least three equal complete UTC days; seven days is preferred when traffic varies by weekday.
2. Run the same aggregate queries with the same time boundaries.
3. Demonstrate the protected-signal checks, not only reduced GB.
4. Record absolute and percentage change in GB/day. Do not extrapolate a monthly saving from a partial day.
5. Record Azure Cost Management impact only after the billing data has caught up; workspace GB is the immediate engineering measure.

### Query hygiene

- Read-only queries only for analysis and validation.
- Return aggregate counts, hashes, roles, severity, duration buckets, and billed size rather than raw payloads.
- Never project URL query strings, probe tokens, credentials, request/response bodies, user identifiers, or audit payload properties into work-package evidence.
- Explicitly set the query time span in both the API request and KQL where supported. The investigation found that a default 24-hour API timespan can silently override a wider KQL predicate.

## Global stop conditions

Stop rollout and restore the prior configuration when any condition is met:

- Any availability destination produces no current structured result or no alert metric series.
- The controlled availability alert does not fire and resolve within its configured evaluation windows.
- Exceptions, failures, audit events, or retained status-code telemetry decrease without a matching workload change.
- Slow-call visibility or latency distributions become unavailable.
- A filter matches by broad message text when a stable category/type/status predicate is available.
- A deployment reveals an unpublished shared-package dependency. Apply the NuGet dependency gate and stop at the package boundary.
- Telemetry contains an expanded secret-bearing URL or response body.

## Evidence still required during implementation

- The precise Azure Monitor ingestion contract that converts the OpenTelemetry log dimensions into Application Insights availability results.
- The root cause of the July availability gap and whether it affects all routed targets or only the custom multi-target exporter.
- The alert no-data behaviour currently configured or inherited.
- Named consumers for each custom metric family and the unexplained 0.7121 GB `AppMetrics` residual.
- Per-application volumes for successful-fast requests/dependencies before Phase 4 prioritisation.

These unknowns are deliberate investigation tasks in the relevant phases; they are not permission to weaken the safety gates.
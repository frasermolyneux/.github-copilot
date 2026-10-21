# Phase 1 · Part 2 — Validate & Measure Production SiteWatch Trace Suppression

Implementation evidence: [part-2-implementation-evidence.md](part-2-implementation-evidence.md)

## Deployment assumption

This runbook assumes Part 1 is fully deployed through the normal production workflow to all three SiteWatch regions: `eastus`, `uksouth`, and `westeurope`. Begin validation after that workflow reports a successful deployment for every region.

Record the production deployment completion timestamp and deployed build/version before running validation. Do not treat a partially updated regional fleet as the start of the post-change measurement window.

**Governance exception:** this deployment occurred while the governing Phase 0 gate still prohibited Phase 1 deployment. Continue read-only validation and measurement only. Do not perform another deployment, execute a controlled failure, declare the Part 2 exit gate passed, or advance to a later phase until Phase 0 Part 2 passes or the governing gate is formally changed with an approved rationale.

## 2.A — Immediate production validation

Allow normal exporter and ingestion delay, then verify all three regional Function Apps during the first two alert evaluation windows:

1. Confirm each regional app is running the expected build and has resumed scheduled executions.
2. Confirm healthy checks continue across the default, portal, and geo-location destinations.
3. Query the four stable framework lifecycle event names: `RequestPipelineStart`, `RequestStart`, `RequestEnd`, and `RequestPipelineEnd`.
4. Query retry warnings, terminal errors, exceptions, HTTP dependencies, and native availability results using the same aggregate predicates as the [Part 1 evidence](part-1-implementation-evidence.md).
5. Inspect exporter errors, Function failures, availability metric series, and alert state.

Required outcomes:

- The four routine framework lifecycle event classes fall to approximately zero after every region is on the new build. Allow only documented deployment-overlap or ingestion-delay rows.
- Retry warnings and terminal errors remain present when naturally exercised and remain sanitised.
- HTTP dependency success/failure, result code, and duration telemetry remains queryable.
- Structured availability results remain current for every expected component and region in the default, portal, and geo-location destinations.
- Availability metric series continue feeding every enabled alert in the reconciled inventory.
- No unexplained reduction appears in exceptions, failures, retries, or regional execution counts.

Roll back immediately on a Phase 0 safety-gate regression. The rollback is to remove `ConfigureLogging(SiteWatchHttpClient.ConfigureLogging)` and redeploy; no Terraform, package, or availability configuration reversal is required.

## 2.B — Controlled protected-signal check

**Hard prerequisite:** do not execute this section while [Phase 0 Part 2](../telemetry-cost-optimisation-phase-0/part-2-remediate-failing-probe.md) is open. Before any controlled failure, the terminal path must no longer log expanded URIs or response bodies, exceptions must not contain expanded URIs, secret-scanning tests must pass, and the owner must confirm rotation of any potentially exposed credential without disclosing it.

After that gate and immediate production validation both pass:

1. Use a non-customer synthetic check to create a bounded failing condition. Do not intentionally fail a production customer endpoint.
2. Hold the failing condition only until the intended alert fires or a predeclared maximum duration expires. Set the maximum to cover the configured evaluation window plus ingestion/evaluation delay, and record it before starting.
3. During the bounded failure, confirm retry warnings, terminal errors, failed dependencies, and failed structured availability results remain visible.
4. Restore the synthetic check unconditionally in a cleanup step, even when the alert does not fire or another validation fails. Confirm restoration before investigating or rolling back the logging change.
5. Confirm successful structured availability resumes, the sanitised success/recovery application event remains queryable, and the alert resolves. If the current implementation does not emit a distinct transition-only event, record the successful post-failure event used as recovery evidence rather than claiming a dedicated transition signal.
6. Exercise one slow successful response only when an existing safe synthetic endpoint can do so without customer impact; otherwise rely on naturally occurring retained slow dependencies and record that limitation.

If no production-safe synthetic route exists, perform the controlled failure against the existing dev synthetic route only after the hard prerequisite passes. Combine that evidence with production metric-input and action-group test-notification evidence. Do not claim that a dev informational route proves production critical/high/low notification delivery.

## 2.C — Equal-window measurement

Use only complete UTC days after the production deployment completion day. The first eligible post-change day is the first `00:00–24:00 UTC` period during which all three regions ran the new build for the entire day.

The recorded pre-change baseline is `2026-07-28T00:00:00Z` inclusive to `2026-08-01T00:00:00Z` exclusive. Compare:

- An initial three-day post-change window against `2026-07-28T00:00:00Z` inclusive to `2026-07-31T00:00:00Z` exclusive.
- A final four-day post-change window against the full recorded four-day baseline.

Do not use a partial deployment day. Do not claim a seven-day comparison unless an equivalent seven complete-day pre-change window is captured that remains after the Phase 0 deployment.

| Measure                                   | Pre-change denominator                     | Required outcome                                                                     |
| ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Four routine lifecycle event classes      | 0.309379 GiB/day and 336,143 rows/day      | Approximately zero after deployment, except documented overlap/delay.                 |
| Total regional SiteWatch `AppTraces`      | 0.403008 GiB/day and 433,330 rows/day      | Material reduction, reported as measured rather than projected.                      |
| Availability result count                 | Configured executions by destination/region | Expected executions reconcile after separately documented missed ticks or outages.   |
| Exception/failure/retry counts            | Matching fixed-window Part 1 aggregates    | No unexplained reduction.                                                            |
| Dependency failure and latency visibility | Matching fixed-window Part 1 aggregates    | Preserved.                                                                           |
| Alert input/fire/recovery                 | Phase 0 and immediate validation evidence  | Preserved.                                                                           |

Before querying, attach the exact sanitised KQL, workspace, classifier definitions, and explicit API timespan for each measure to the evidence record. Set identical start/end boundaries in both KQL and the query API so a default API timespan cannot truncate the result.

Use those fixed queries for both windows. Record absolute and percentage changes in daily rows and GiB, protected-signal counts, dependency p50/p95/p99, and availability results by destination/component/location. Keep `GiB` as the unit throughout.

Calculate expected availability results as configured checks per destination × active regions × scheduled executions in the fixed window. Reconcile missed timer ticks, deployments, host restarts, and outages separately. Retries occur inside one check execution and must not increase or excuse the expected structured availability result count; measure them as protected trace evidence.

Do not claim the historical 18.0325 GB as the achieved saving. Keep the fresh routine-event baseline separate from the total regional `AppTraces` baseline, and report measured post-change results against the matching denominator rather than a projection.

## 2.D — Evidence record

Add the production deployment timestamp, deployed version, immediate validation, controlled-signal evidence, exact sanitised KQL/API timespans, equal-window query boundaries, aggregate results, alert transitions, and rollback status to the implementation evidence. Update the Part 1 handoff wording when deployment completes. Keep the evidence aggregate-only and exclude URLs, query strings, tokens, response bodies, connection strings, and raw messages.

## Part 2 exit gate

- The Phase 0 Part 2 safety gate passes, or an approved specification change formally reconciles the sequencing exception.
- All three production regions run the expected build and pass the immediate safety checks.
- Phase 0 Part 2 passes before any controlled-failure exercise begins.
- The controlled protected-signal check is restored unconditionally and fires/resolves through a safe synthetic route, or the documented fallback evidence proves the production alert inputs and notification routes without intentionally failing a customer endpoint.
- Successful post-failure availability and sanitised application recovery evidence remain queryable; any absence of a dedicated transition-only event is recorded accurately.
- Equal-window evidence is attached to the implementation log/PR without sensitive payloads.
- Routine lifecycle suppression and the measured ingestion reduction are demonstrated across complete UTC days.
- Rollback remains available and its exact code reversal is documented.
- `code-review` has no unresolved High/Medium findings.

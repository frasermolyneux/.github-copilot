# Phase 2 · Part 2 — Consolidate Metrics & Migrate Consumers

Do not start until the Part 1 decision table is approved.

## 2.A — Implement package/emitter changes

For each approved family:

1. Change the owning emitter to the canonical instrument/result.
2. Preserve stable bounded dimensions needed by consumers; remove high-cardinality message, URL, ID, and user dimensions.
3. Remove derived siblings only after replacement queries are ready.
4. Add unit tests asserting instrument count, names, dimensions, and value semantics.
5. Add exporter/integration tests where aggregation behavior matters.

If `observability-opentelemetry` or `observability-appinsights` changes, publish the package and stop before consumers:

```text
NuGet dependency gate reached.
Package: <actual MX.Observability package>
Required version: <published version or TBD>
Owner repo: observability-opentelemetry or observability-appinsights
Consumer repo(s): <mapped consumers>
Status: Phase 1 complete, waiting for publish/review before Phase 2.
```

Do not bridge the gate with project references or copied instruments.

Local work-package stop: Phase 2 Part 2 pauses after the shared emitter package is reviewed and ready to publish; consumer migration resumes only after the published version is approved.

## 2.B — Migrate consumers

- Build replacement alert criteria and workbook/dashboard queries so they tolerate the old signal and the new canonical signal during transition.
- Deploy replacement consumers before removing the old emitter. Compare old/new expressions side by side over the same interval and verify replacement telemetry/query parity.
- Switch alerts and operational consumers to the new signal only after parity passes; verify alert state and notification routing before changing emission.
- Remove the old emitter after all named consumers have switched, then verify the old series stops and the new series/alerts remain current.
- Roll back in reverse order: restore the old emitter first, verify data, switch consumers back, then remove the replacement consumer logic if necessary.
- If consumer-first deployment is technically impossible, require owner approval for a bounded production dual-emission window with start/end time, measured cost, and automatic removal criterion.
- Update runbooks and docs with the canonical metric names and example aggregate queries.

## 2.C — Rollout order

1. Shared package (if required), publish, approve version.
2. One low-risk dev emitter plus old/new-tolerant consumers; prove query and alert parity.
3. SiteWatch dev, including availability alert exercises and the full consumer-first cutover.
4. One production family: replacement consumers → parity → consumer switch → old emitter removal.
5. Remaining approved families in small batches using the same ordered cutover and separate measurements.

## 2.D — Validation

For each batch:

- Build, tests, and `dotnet format --verify-no-changes` in every .NET repo.
- Terraform format/validate/dev plan for alert or setting changes.
- Old and replacement query parity for at least one representative healthy, failed, and slow interval.
- Availability fire/recovery gate remains green.
- No loss of audit, exception, failed request/dependency, or slow-call telemetry.
- At least three equal complete UTC days of `AppMetrics` and total ingestion before/after; seven preferred.

## Part 2 exit gate

- Approved derived/duplicate series no longer arrive.
- All named consumers use and validate the replacement.
- Unknown/platform-generated metrics remain unchanged and documented.
- Actual reduction and query-cost tradeoff are recorded.
- Rollback evidence and `code-review` are complete.
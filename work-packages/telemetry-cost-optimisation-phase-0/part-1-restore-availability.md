# Phase 0 · Part 1 — Restore Structured Availability & Alerting

Assigned to a stronger agent. Keep the investigation concise, evidence-led, and read-only until a root cause and patch are identified.

## Known starting point

- `ExternalHealthCheck` calls `IAvailabilityTelemetry.Track()` for success and terminal failure.
- `MultiTargetAvailabilityTelemetry` creates dedicated Azure Monitor OpenTelemetry log exporters for the default and named target connection strings.
- `OpenTelemetryAvailabilityTelemetry` writes an information log with `microsoft.availability.*` dimensions.
- Unit tests cover in-memory target routing and property propagation, not Azure Monitor ingestion conversion.
- The dated investigation found ten enabled deployed alerts. Current Terraform creates alerts from `var.availability_tests`, so the source-defined and deployed counts may differ and must be reconciled before validation.
- After 17 July, SiteWatch traces continued but the workspace returned exactly zero SiteWatch `AppAvailabilityResults`; live metric queries returned no series on the three alert destinations.

## Investigation

1. **Reconcile source and deployment.** Map source-defined tests and planned Terraform alerts to deployed/enabled alerts by logical check, destination component, dimension/value, severity, action group, and environment. Record every intentional difference; do not use the dated count of ten as the expected source count.
2. **Reproduce safely in dev.** Emit one uniquely named, non-sensitive synthetic result through the current default path and one named target. Record exporter diagnostics, ingestion destination, table/type, dimensions, and delay.
3. **Trace the conversion boundary.** Verify against current Azure Monitor/OpenTelemetry documentation and package versions whether logs carrying `microsoft.availability.*` are supported for conversion into Application Insights availability telemetry. Do not rely on source comments as evidence.
4. **Compare default and target exporters.** Check resource attributes, connection strings, logger category, formatted/state settings, exporter registration, disposal/flush, every host/SDK/resource sampling layer, processor order, sampling exclusions, and service-name dimensions. Never print connection strings.
5. **Check deployed configuration.** Read-only inventory the three regional Function Apps, target names, destination component IDs, package/build version, and alert scopes. Confirm no target silently falls back to the host sink.
6. **Check alert semantics.** Establish no-data behaviour, dimension value shape, and whether the `StartsWith` criterion matches the emitted availability name.

## Choose the owning fix

Use the smallest supported path that yields native availability results and metrics:

- **SiteWatch-local defect:** fix `MultiTargetAvailabilityTelemetry`/registration in `platform-sitewatch-func` when the shared single-target emitter is proven healthy.
- **Shared emitter defect:** fix and integration-test `OpenTelemetryAvailabilityTelemetry` in `observability-opentelemetry`; publish first, then consume the approved package version in SiteWatch.
- **Unsupported conversion contract:** replace the emitter with a supported Azure Monitor/Application Insights availability API behind `IAvailabilityTelemetry`. Keep multi-target routing in SiteWatch and do not leak Azure-specific implementation into callers.
- **Alert-only defect:** correct Terraform scope/metric namespace/dimension only if structured availability rows already arrive correctly.

Do not dual-write permanently. A temporary dual-write may be used only in dev to compare paths, must have a removal criterion, and must never create duplicate production alerts/results.

## Tests

- Unit: success/failure fields, UTC timestamp, duration, location, message sanitisation, component property, default route, named route, unknown-target fallback, disposal/flush behavior where testable.
- Integration: use a test exporter or supported ingestion test to assert the emitted telemetry type and dimensions, not just a logger call.
- Terraform: alert scope and dimension tests/plan if alert code changes.
- Regression: no availability result is processed by generic log severity filters or percentage sampling.

## Deployed exit gate

1. Deploy dev through the normal workflow.
2. Prove at least three consecutive successful results per configured region and destination in the structured availability table.
3. Prove current `count` and `availabilityPercentage` metric series split by check name/location.
4. Introduce one controlled, non-secret test failure. Confirm the intended alert fires after its configured window and action-group notification is received.
5. Restore the test. Confirm success results resume and the alert resolves.
6. Repeat a non-destructive production smoke check after deployment; do not intentionally break a production customer endpoint.
7. For every distinct production destination/criterion/action-group route in the reconciled inventory, prove current metric input on the intended component and validate notification delivery. Prefer a non-customer synthetic check that can safely exercise pass-to-fail-to-recovery; otherwise use the supported action-group test-notification facility plus criterion/metric evidence. Do not claim that a dev informational route proves production critical/high/low routing.

Record timestamps, component names, aggregate counts, alert state transitions, build/package versions, and ingestion delay. Do not record endpoint payloads.

## NuGet dependency gate

If `observability-opentelemetry` changes:

```text
NuGet dependency gate reached.
Package: MX.Observability.OpenTelemetry and/or MX.Observability.OpenTelemetry.WorkerService
Required version: TBD from Phase 0 Part 1 release
Owner repo: observability-opentelemetry
Consumer repo(s): platform-sitewatch-func
Status: Phase 1 package change complete, waiting for publish/review before Phase 2.
```

Use the actual package/version in the implementation report. Do not update the consumer until the package is published and approved.

Local work-package stop: Phase 0 Part 1 ends after the shared package is reviewed and ready to publish; resume the SiteWatch consumer remediation only after the published version is approved.
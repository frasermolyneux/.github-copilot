# Phase 4 · Part 1 — Inventory the Estate & Select a Pilot

This part is read-only analysis and source inspection. It produces the rollout ledger; it does not change sampling/filtering.

## 1.A — Component-to-host map

For every Application Insights component connected to the workspace:

1. List current application roles and role instances over at least seven complete UTC days.
2. Map role → executable/project → repo → hosting resource → destination component.
3. Record telemetry stack:
   - `MX.Observability.ApplicationInsights.AspNetCore` / `.WorkerService`;
   - `MX.Observability.OpenTelemetry.AspNetCore` / `.WorkerService`;
   - direct SDK/auto-instrumentation/other.
4. Record exact package versions, registration path, config section, and whether filtering is enabled.
5. Map every sampling stage and its order: SDK adaptive/fixed sampling processors, OpenTelemetry sampler/processors, Azure Functions `host.json` sampling, exporter behavior, Application Insights resource ingestion sampling, and any workspace transformation. Record effective percentage, telemetry-type inclusions/exclusions, and the proved bypass path for audit/security, exceptions, failures, slow calls, and availability.
6. Distinguish multiple processes sharing `ai-portal-core-*`; do not assign component-wide volume to one repo.

## 1.B — Signal and cost profile

For each role, record:

- `AppRequests` and `AppDependencies` rows/GB per complete day.
- Success/failure and status/result-code distribution.
- Duration p50/p95/p99 and candidate successful-fast volume below 500/1,000/2,000 ms.
- Health/readiness traffic separately.
- Exceptions, traces, audit/custom events, alerts, workbooks, dashboards, and SLO consumers.
- Correlation needs: confirm retained failures/slow calls still link to traces and exceptions.

Use aggregate-only queries and the hygiene rules in [evidence-and-safety.md](../telemetry-cost-optimisation-spec/evidence-and-safety.md).

## 1.C — Configuration drift check

Inspect every owning repo for:

- Correct `AddObservability()` registration, exporter wiring, and processor/sampler order.
- `ApplicationInsights:TelemetryFilter` or `OpenTelemetry:Filtering` settings and environment overrides.
- App Configuration selectors that actually load the filter section.
- Package version support for the configured options.
- Duplicate SDK/auto-instrumentation pipelines and downstream sampling that can remove an item after the shared filter retains it.
- Diagnostic settings that separately send equivalent HTTP/platform telemetry.

Classify each host: `policy active`, `policy configured but ineffective`, `package upgrade required`, `custom pipeline`, or `unknown`.

## 1.D — Pilot selection

Score candidates using:

- Material successful-fast GB/day.
- Mature unit/integration tests and a dev environment.
- Existing shared-package integration and configuration rollback.
- Clear failure/latency alerts and low audit sensitivity.
- Stable traffic across weekdays.
- No concurrent migration or incident.

Exclude SiteWatch (Phases 1–3), legacy/decommissioning apps without a safe deployment path, and any role whose ownership is unresolved.

## Part 1 exit gate

- Rollout ledger covers at least 95% of request/dependency GB/day; remainder is `Unknown keep`.
- One pilot and one fallback pilot are owner-approved.
- Candidate thresholds are justified by SLO/latency data, not cost alone.
- Baseline query set, complete sampling-pipeline map, protected-type exclusions, and rollback configuration are recorded.
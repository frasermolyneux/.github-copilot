# Phase 4 · Part 3 — Run the Production Pilot

## 3.A — Configure the pilot

- Set request and dependency thresholds from Part 1 evidence; 1,000 ms is the shared starting default, not a mandate.
- Retain HTTP 400–599 unless specific expected statuses are separately justified.
- Retain required dependency result codes, including throttling/unavailable codes used by the workload.
- Exclude routine successful liveness/readiness paths.
- Keep audit/custom-event filtering unchanged unless Part 2 explicitly tested it.
- Configure every SDK/host/resource sampling layer so protected telemetry classes bypass sampling; record processor order and effective exclusions.
- Make rollback a configuration reversal wherever possible.

Add configuration through the repo's established source (appsettings/App Configuration/Terraform). Do not introduce secrets or hard-coded Azure IDs.

## 3.B — Dev proof

Exercise:

- successful fast and slow requests;
- client and non-HTTP dependencies where used;
- HTTP 4xx/5xx and retained dependency codes;
- exception correlation;
- health success/failure;
- representative audit event;
- live config reload if supported.

Prove the expected keep/drop matrix with direct assertions and end-to-end aggregate destination queries. A retained item that is later removed by adaptive, host, exporter, resource, or workspace sampling fails the pilot.

## 3.C — Production deployment

- Deploy through the normal protected workflow.
- Observe at least two hours for filter/config/exporter errors and protected signal continuity.
- Compare at least three equal complete UTC days before/after; prefer seven.
- Compare traffic/business counters external to Application Insights so a telemetry reduction is not mistaken for lower workload traffic.
- Emit uniquely classified, non-sensitive protected test events in dev and confirm destination counts across the full pipeline before production. In production, use naturally occurring or safe synthetic signals and do not manufacture customer-impacting failures.

## 3.D — Pilot decision

Record:

- Request/dependency and total GB/day change.
- Failure, exception, audit, and slow-call counts normalized by traffic.
- Latency p95/p99 visibility and alert behavior.
- Query/debugging experience during at least one controlled failure.
- Configuration/package rollback outcome.

Decision is one of `Adopt defaults`, `Adopt with revised thresholds/exclusions`, or `Reject and rollback`. A reduction alone is not a pass.

## Part 3 exit gate

- Pilot owner approves operational visibility.
- No protected-signal regression remains.
- Measured saving and threshold rationale are recorded.
- Rollback and `code-review` pass.
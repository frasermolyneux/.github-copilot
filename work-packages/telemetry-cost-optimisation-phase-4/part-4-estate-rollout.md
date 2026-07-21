# Phase 4 · Part 4 — Roll Out Across Connected Applications

## 4.A — Batch design

Group hosts by stack and risk, not merely by destination component:

1. Same shared package/version and configuration source as the successful pilot.
2. Same stack but package/config drift requiring small remediation.
3. High-volume or audit-sensitive portal hosts.
4. Custom/legacy pipelines and approved exceptions.

Keep each batch small enough to attribute workspace changes to named roles. Do not change all processes sharing `ai-portal-core-*` in one unmeasurable deployment.

## 4.B — Per-host checklist

- Ownership and role mapping confirmed.
- Current package/version and config load tested.
- Request/dependency baseline and threshold rationale recorded.
- Alerts/workbooks/SLOs audited.
- Failure/status/result-code/slow-call rules explicit.
- Audit and exception tests pass.
- Dev controlled calls pass.
- Build/tests/format and Terraform checks pass.
- Configuration rollback documented.

## 4.C — Batch validation

- Deploy dev, then production through normal workflows.
- Compare equal complete days by role, not only component/workspace total.
- Normalize failures and latencies by workload traffic.
- Stop the batch on protected-signal loss; do not continue to compensate with a broader trace level.
- Record package/config version and effective policy in the rollout ledger.

## 4.D — Exception register

An exception must include owner, role/repo, reason, protected consumer, current volume, compensating control, review date, and removal criterion. Valid examples include low-volume workloads where filtering complexity exceeds savings or a latency SLO requiring denser successful observations. `Unknown` is temporary and requires an owner/date.

## Part 4 exit gate

- Every current role is `Aligned` or has an approved exception.
- Workspace and per-role request/dependency run rate is measured after the final batch.
- Audit, exception, failure, slow-call, and alert evidence remains healthy.
- The rollout ledger is ready to become Phase 5 policy evidence.
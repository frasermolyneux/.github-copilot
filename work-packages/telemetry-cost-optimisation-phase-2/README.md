# Phase 2 — Consolidate Redundant Metric Series (Executable Plan)

Implement recommendation 3 from the [specification](../telemetry-cost-optimisation-spec/README.md): retain canonical measurements and remove redundant derived series only after every consumer is mapped.

> **Prerequisites:** [Phase 0](../telemetry-cost-optimisation-phase-0/README.md) proves structured availability and alerting. [Phase 1](../telemetry-cost-optimisation-phase-1/README.md) is measured first so SiteWatch savings remain attributable.

## What Phase 2 delivers

- **Part 1 — inventory and decision map** ([part-1-metric-consumer-map.md](part-1-metric-consumer-map.md)): reconcile `AppMetrics` to emitters and consumers, classify every material family, and design the minimum replacement contract.
- **Part 2 — implementation and rollout** ([part-2-consolidate-and-roll-out.md](part-2-consolidate-and-roll-out.md)): remove only approved redundant emissions, update consumers to derive aggregates, and measure cost/signal impact.

## Starting evidence

- `AppMetrics` contributed 4.8156 GB in the 30-day baseline.
- 4.1035 GB was mapped to 70 series; 0.7121 GB remained unexplained and is excluded from savings estimates.
- Several logical families appeared to emit variants such as `Count`, `Successes`, `Failures`, `SuccessRate`, `MinDurationMs`, `MaxDurationMs`, and `AvgDurationMs`.
- The evidence does **not** prove those variants share one emitter or are all removable. Part 1 owns that proof.

## Golden rules

- Unknown consumer or unknown emitter means **keep**, not delete.
- Platform-generated Azure/Functions metrics are not treated as application-controlled until proved.
- Native availability metrics backing alerts are protected.
- Prefer one count plus one duration histogram/measurement, or one structured availability result, over pre-computed count/rate/min/max/average siblings.
- Derive dashboard aggregates at query time only when query cost and responsiveness remain acceptable.
- Any shared package change is package-first and stops at the NuGet publication gate.

## Definition of done

- At least 95% of `AppMetrics` GB/day is attributed to an emitter/type, or the unattributed remainder is explicitly retained.
- Every removed series has a documented replacement or a proved absence of consumers.
- Alerts, workbooks, dashboards, SLOs, and operational runbooks use canonical retained signals.
- Availability metric series and all Phase 0 controls remain healthy.
- Complete-day pre/post evidence reports actual `AppMetrics` and total-workspace change without adding Phase 1 savings twice.
- Build/tests/format, relevant Terraform checks, and `code-review` pass.

## Next

[Phase 3](../telemetry-cost-optimisation-phase-3/README.md) reduces SiteWatch execution cadence after the canonical result contract is stable.
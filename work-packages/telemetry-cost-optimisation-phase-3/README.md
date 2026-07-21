# Phase 3 — Move SiteWatch to a 60-Second Cadence (Executable Plan)

Implement recommendation 4 from the [specification](../telemetry-cost-optimisation-spec/README.md): keep three-region coverage but reduce normal production execution from every 30 seconds to every 60 seconds.

> **Prerequisites:** Phase 0 alerting is proven; Phase 1 trace filtering and Phase 2 metric consolidation have stable measurements. The expected result contract must be known before changing its frequency.

## What Phase 3 delivers

- **Part 1 — configurable schedule** ([part-1-configurable-schedule.md](part-1-configurable-schedule.md)): externalize the timer schedule, add validation/tests/docs, and configure a 60-second production default.
- **Part 2 — rollout and alert validation** ([part-2-rollout-and-alert-validation.md](part-2-rollout-and-alert-validation.md)): prove the 30-minute availability alerts remain responsive, then measure the incremental cadence saving.

## Locked decisions

- Keep all three deployed regions.
- Production default: once per minute (`0 * * * * *` equivalent).
- Schedule is app configuration/Terraform controlled, not a source-code constant.
- The 30-minute alert window and threshold remain unchanged unless Phase 3 evidence shows a separate alert-quality defect; do not tune thresholds to make rollout pass.
- Prevent overlapping timer batches or explicitly prove host timer semantics prevent them. One failing check can take approximately 34 seconds with retries, so a 60-second interval should normally complete before the next tick.

## Definition of done

- Schedule is configurable and fails fast on missing/invalid production configuration.
- Production executes approximately once per minute in each of three regions.
- Structured availability count matches the expected schedule with documented tolerance for deployment/restart intervals.
- Controlled alert fire and recovery still meet operational expectations.
- Incremental reduction is measured separately from Phases 1–2.
- Build/tests/format, Terraform checks, docs, and `code-review` pass.

## Next

[Phase 4](../telemetry-cost-optimisation-phase-4/README.md) applies successful-fast request/dependency controls to the broader application estate.
# Phase 1 · Part 2 — Roll Out & Measure SiteWatch Trace Suppression

## 2.A — Dev deployment

Deploy through the normal dev workflow and run:

1. Several healthy checks across representative default, portal, and geo-location targets.
2. One controlled HTTP failure that causes retries and a terminal failure.
3. One slow successful response if a safe test endpoint supports it.

Verify:

- Routine framework lifecycle traces are absent.
- Retry warnings and terminal error remain sanitised.
- Dependency success/failure and duration telemetry remains according to policy.
- Structured availability results and metric series remain current.
- The controlled availability alert still fires and resolves.

## 2.B — Production rollout

- Deploy all three regions through the normal workflow. If regional staged rollout is supported, start with one region; otherwise use a normal deployment and retain the configuration rollback.
- Watch exporter errors, Function failures, availability series, alert state, and trace/dependency counts during the first two evaluation windows.
- Roll back immediately on a Phase 0 safety-gate regression.

## 2.C — Measurement

Compare at least three equal complete UTC days before and after; prefer seven days:

| Measure | Required outcome |
| --- | --- |
| Four routine lifecycle trace class | Approximately zero after deployment. |
| Total SiteWatch `AppTraces` GB/day | Material reduction, reported as measured rather than projected. |
| Availability result count | Matches expected checks × regions × executions, allowing documented retries/outages. |
| Exception/failure/retry counts | No unexplained reduction. |
| Dependency failure and latency visibility | Preserved. |
| Alert input/fire/recovery | Preserved. |

Do not claim the historical 18.0325 GB as the achieved saving; use the fresh post-transition run rate.

## Part 2 exit gate

- Dev and production safety checks pass.
- Equal-window evidence is attached to the implementation log/PR without sensitive payloads.
- Rollback remains available and tested at configuration level where possible.
- `code-review` has no unresolved High/Medium findings.
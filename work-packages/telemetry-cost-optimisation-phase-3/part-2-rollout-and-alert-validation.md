# Phase 3 · Part 2 — Roll Out Cadence & Validate Alert Quality

## 2.A — Dev validation

1. Deploy the one-minute setting to dev.
2. Observe at least two hours of normal execution across every configured check and region.
3. Expected normal result count is approximately:
   - per check/region: 60 results/hour;
   - across three regions: 180 results/hour;
   - allow documented deployment, restart, timeout, or disabled-check gaps.
4. Force one controlled test check to fail long enough to cross the 30-minute alert window.
5. Confirm alert fire, action-group notification, continued failed results, recovery results, and alert resolution.

If detection/recovery is operationally too slow, stop for an alert-design decision. Do not restore 30-second cadence automatically or weaken the threshold without comparing alternatives.

## 2.B — Production rollout

- Deploy through the protected production workflow.
- During the first hour, monitor result cadence, Function execution failures, timer past-due indicators, exporter errors, and alert metric continuity.
- During the first complete day, compare expected versus actual results per region/check and investigate material gaps.
- Roll back to the prior setting if any destination loses current structured availability or alert input.

## 2.C — Incremental measurement

Use equal complete UTC days after Phase 2:

- SiteWatch executions/day and results/day should fall close to 50% of the 30-second baseline.
- Remaining per-execution telemetry should remain approximately stable.
- Record reduction in SiteWatch dependencies, availability records, and retained custom metrics separately.
- Confirm retry/failure/exception/audit counts follow actual events rather than frequency artifacts.
- Record alert detection/recovery time and any flapping difference.

Do not add this saving to the original Phase 1 historical estimate; use the immediately preceding stable Phase 2 baseline.

## Part 2 exit gate

- One-minute cadence is stable across three regions for at least three complete days; seven preferred.
- Controlled dev alert fire/recovery passes.
- Production alert metrics contain current data with expected density.
- Incremental GB/day reduction and operational impact are documented.
- Rollback and `code-review` gates are complete.
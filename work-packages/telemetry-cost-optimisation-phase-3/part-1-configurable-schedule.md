# Phase 3 · Part 1 — Make the SiteWatch Schedule Configurable

## 1.A — Baseline

Record over at least three complete UTC days:

- Executions per logical check and region.
- Structured availability results per check/region.
- Batch duration p50/p95/p99 and maximum.
- Overlap/concurrency evidence and host restarts.
- Alert detection/recovery timing for controlled dev failures.
- SiteWatch GB/day by traces, dependencies, availability, and metrics.

## 1.B — Implementation

In `platform-sitewatch-func`:

1. Replace the literal timer expression with an Azure Functions app-setting expression (for example `%SiteWatchSchedule%`, after verifying the supported binding syntax for the installed Functions packages).
2. Add the setting through Terraform for every region/environment. Keep environment values explicit in tfvars or an established environment map; do not hide production behavior in an unexplained source constant.
3. Set production to the once-per-minute expression. Dev may remain at 30 seconds for short validation only if documented; otherwise align it to production.
4. Validate schedule presence/shape at startup or through binding tests so a missing setting does not silently stop monitoring.
5. Update `.github/copilot-instructions.md`, `README.md`, and operational docs that currently state a 30-second schedule.
6. Preserve `MaxConcurrentChecks`, timeout, retries, cancellation, and all Phase 0/1 telemetry behavior.

Do not make the interval a numeric delay loop inside the function. The Functions timer trigger remains the scheduler.

## 1.C — Tests

- Generated Functions metadata references the setting expression rather than a hard-coded 30-second cron.
- Dev/test configuration resolves to a valid six-field NCRONTAB expression.
- Missing/invalid configuration fails deployment/startup visibly.
- Existing check execution, cancellation, retry, and result tests pass.
- Terraform tests/plan show only the intended app-setting change and any required restart.

## 1.D — Validate

Run the repo's .NET build/test/format gate and:

```pwsh
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform init -backend-config=backends/dev.backend.hcl
terraform -chdir=terraform validate
terraform -chdir=terraform plan -var-file=tfvars/dev.tfvars
```

Run the production plan through the normal protected workflow/label before production deployment.

## Part 1 exit gate

- Configurable schedule implemented in code and Terraform.
- Once-per-minute production value reviewed.
- Documentation and tests align with actual binding behavior.
- Rollback is the prior 30-second setting through the normal deployment workflow.
---
description: These instructions define the scheduling standards for all GitHub Actions workflows and Dependabot configurations. AI must follow these rules when creating, modifying, or reviewing any workflow schedule or cron expression.
applyTo: '**/*.yml'
---

# Workflow Scheduling Standards

All scheduled workflows in the frasermolyneux organisation follow a centralised "ops clock" to prevent resource contention and respect infrastructure dependencies. The canonical schedule is documented in `docs/ops-clock.md` within the `.github-copilot` repository.

## Golden Rule

**Never assign or change a cron schedule without consulting the ops clock.** Every scheduled workflow has an allocated time slot. Changing one schedule can cause collisions with other workflows sharing the same infrastructure.

## Schedule Architecture

| Day | Window | Workflow Type | Stagger |
|-----|--------|---------------|---------|
| Daily | 23:00–23:50 | destroy-development | 5 min |
| Sunday | 01:00–08:00 | Dependabot | 15 min |
| Monday | 01:00–08:00 | codequality | 15 min |
| Tuesday | — | Clear (buffer) | — |
| Wednesday | 01:00–09:00 | deploy-prd: portal stack | 1 hour |
| Thursday | 01:00–04:00 | deploy-prd: shared plan stack | 1 hour |
| Friday | 01:00–07:00 | deploy-prd: independent repos | 1 hour |
| Saturday | — | Clear (buffer) | — |

## Cron Expression Guidance

When setting or reviewing cron expressions in workflow files:

- **deploy-prd.yml** — use the repo's allocated slot from the ops clock. The cron day must match the repo's infrastructure group (Wed=3, Thu=4, Fri=5). Example: `cron: "0 3 * * 3"` for portal-repository (Wednesday 03:00).
- **codequality.yml** — use the repo's Monday slot. Example: `cron: "30 1 * * 1"` for portal-repository (Monday 01:30).
- **destroy-development.yml** — use the repo's daily slot. Example: `cron: "5 23 * * *"` for portal-repository (daily 23:05).
- **dependabot.yml** — use the same time as the repo's codequality slot, but on Sunday. Example: `time: "01:30"` with `day: "sunday"` for portal-repository.

## Skip-Dev-on-Schedule Pattern (Option 1)

All `deploy-prd.yml` workflows with scheduled triggers must implement the "skip dev on schedule" pattern so that drift-prevention runs only target production:

1. **Dev-only jobs** (`terraform-state-check-dev`, `terraform-plan-and-apply-dev`, app deploy dev jobs): Add `if: github.event_name != 'schedule'`.
2. **`build-and-test`** (when it depends on a skippable dev job): Prepend `!failure() && !cancelled() &&` to the existing `if:` condition so it still runs when its dev dependency is skipped.
3. **Prd gateway job** (first prd job depending on dev): Add `|| github.event_name == 'schedule'` to the dev-result check so prd proceeds when dev is skipped. Pattern: `(needs.terraform-plan-and-apply-dev.result == 'success' || github.event_name == 'schedule')`.

### Why this works

- When `github.event_name == 'schedule'`, dev jobs evaluate their `if:` to `false` and are skipped.
- Skipped jobs have `result == 'skipped'` (not `'success'`), so `!failure() && !cancelled()` passes but `result == 'success'` does not.
- The `|| github.event_name == 'schedule'` fallback on the prd gateway allows the prd pipeline to proceed.
- The `detect-changes` action forces all filter outputs to `true` on schedule/workflow_dispatch, so prd jobs see all changes as detected.

## Dependabot Configuration

All `dependabot.yml` files must use:

```yaml
schedule:
  interval: "weekly"
  day: "sunday"
  time: "HH:MM"  # Must match the repo's codequality Monday slot
```

All ecosystems must include a `groups` configuration to batch updates:

```yaml
groups:
  all-updates:
    patterns:
      - "*"
```

## Adding a New Repository

1. Find the next available slot in the ops clock for each workflow type.
2. Set the cron/schedule accordingly.
3. Update `docs/ops-clock.md` in `.github-copilot` with the new entry.
4. If the repo shares infrastructure (e.g. the `platform-hosting` App Service Plan), place its deploy-prd on the same day as other consumers, after the infrastructure provider.

## Modifying an Existing Schedule

1. Check the current allocation in `docs/ops-clock.md`.
2. Verify the new time doesn't conflict with other repos in the same infrastructure group.
3. Update both the workflow file and `docs/ops-clock.md`.

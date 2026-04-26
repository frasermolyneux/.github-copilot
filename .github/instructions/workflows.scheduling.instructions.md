---
description: These instructions define the scheduling standards for all GitHub Actions workflows and Dependabot configurations. AI must follow these rules when creating, modifying, or reviewing any workflow schedule or cron expression.
applyTo: '.github/workflows/**/*.yml,**/.github/dependabot.yml'
---

# Workflow Scheduling Standards

All scheduled workflows and Dependabot configs in the frasermolyneux organisation follow a centralised "ops clock" to prevent resource contention and respect infrastructure dependencies. The canonical schedule is documented in `docs/ops-clock.md` within the `.github-copilot` repository.

## Golden rule

**Never assign or change a cron schedule without consulting the ops clock.** Every scheduled workflow has an allocated time slot. Changing one schedule can cause collisions with other workflows sharing the same infrastructure.

## Schedule architecture

| Day | Window | Workflow Type | Stagger |
|-----|--------|---------------|---------|
| Daily | 23:00–23:50 | `destroy-development.yml` | 5 min |
| Sunday | 01:00–08:00 | Dependabot (`.github/dependabot.yml`) | 15 min |
| Monday | 01:00–08:00 | `codequality.yml` | 15 min |
| Tuesday | — | Clear (buffer) | — |
| Wednesday | 01:00–09:00 | `deploy-prd.yml` — portal stack | 1 hour |
| Thursday | 01:00–04:00 | `deploy-prd.yml` — shared plan stack | 1 hour |
| Friday | 01:00–07:00 | `deploy-prd.yml` — independent repos | 1 hour |
| Saturday | — | Clear (buffer) | — |

## Cron expression rules

- **`deploy-prd.yml`** — cron day must match the repo's infrastructure group (Wed=3, Thu=4, Fri=5). Example: `cron: "0 3 * * 3"` (Wednesday 03:00).
- **`codequality.yml`** — Monday slot. Example: `cron: "30 1 * * 1"` (Monday 01:30).
- **`destroy-development.yml`** — daily slot from ops clock. Example: `cron: "5 23 * * *"` (daily 23:05).
- **Dependabot** — must use `time:` matching the repo's Monday codequality slot, but `day: "sunday"`. Example: `time: "01:30"`.

The repo-to-slot mapping is maintained in `docs/ops-clock.md` — consult it for the exact slot to use for any specific repo.

## Skip-dev-on-schedule pattern

All `deploy-prd.yml` workflows with scheduled triggers must skip dev jobs on schedule so drift-prevention only targets production.

1. **Dev-only jobs** (`terraform-state-check-dev`, `terraform-plan-and-apply-dev`, app-deploy-dev): add `if: github.event_name != 'schedule'`. If the job already has an `if:`, prepend `github.event_name != 'schedule' &&`.
2. **`build-and-test`** (when it depends on a skippable dev job): prepend `!failure() && !cancelled() &&` so it still runs when its dev dependency is skipped.
3. **Prd gateway job** (first prd job depending on dev result): add `|| github.event_name == 'schedule'` to the dev-result check:

   ```yaml
   if: |
     !failure() && !cancelled() &&
     (needs.terraform-plan-and-apply-dev.result == 'success' || github.event_name == 'schedule')
   ```

### Why it works

- `github.event_name == 'schedule'` evaluates dev jobs' `if:` to `false`, so they are skipped (`result == 'skipped'`, not `'success'`).
- `!failure() && !cancelled()` passes for skipped upstream jobs.
- The `|| github.event_name == 'schedule'` fallback lets the prd gateway bypass the dev-success check on scheduled runs.
- The `detect-changes` action forces all outputs to `true` on schedule, so prd jobs see all changes as detected.

For terraform-only repos (no source code), simplify: just add `if: github.event_name != 'schedule'` to `terraform-plan-and-apply-dev` and the schedule fallback to the prd job.

## Dependabot configuration

All `.github/dependabot.yml` files must use:

```yaml
schedule:
  interval: "weekly"
  day: "sunday"
  time: "HH:MM"  # Match the repo's codequality Monday slot
```

All ecosystems must include a `groups` block to batch updates into a single PR per ecosystem:

```yaml
groups:
  all-updates:
    patterns:
      - "*"
```

See `workflows.dependabot-config.instructions.md` for the full file template.

## Adding a new repository

1. Find the next available slot in the ops clock for each workflow type.
2. Set the cron/schedule accordingly.
3. Update `docs/ops-clock.md` in `.github-copilot` with the new entry.
4. If the repo shares infrastructure (e.g. an App Service Plan provided by another repo), place its `deploy-prd` on the same day as other consumers, after the infrastructure provider.

## Modifying an existing schedule

1. Check the current allocation in `docs/ops-clock.md`.
2. Verify the new time doesn't conflict with other repos in the same infrastructure group.
3. Update both the workflow file and `docs/ops-clock.md`.

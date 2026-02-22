---
description: These instructions define the deploy-prd.yml workflow pattern including change detection, conditional job execution, and dependency guards. AI should follow these patterns when generating, reviewing, or modifying deploy-prd.yml workflows.
applyTo: '**/deploy-prd.yml'
---

# deploy-prd.yml Workflow Pattern

This document defines the standard pattern for production deployment workflows across the frasermolyneux organisation. The goal is to minimise unnecessary work by detecting what changed and only running the jobs that are actually needed.

## Triggers

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:
  schedule:
    - cron: "0 X * * D"  # See docs/ops-clock.md for this repo's allocated slot
```

- No `paths:` filter — change detection is handled at runtime by the `detect-changes` job.
- `workflow_dispatch` and `schedule` triggers force all change flags to `true` (built into the `detect-changes` action).
- **Schedule allocation**: each repo has an assigned day and hour in the ops clock. Portal stack deploys Wednesday, shared-plan stack Thursday, independent repos Friday. Staggered by 1 hour within each day. Consult `docs/ops-clock.md` in the `.github-copilot` repository for the exact cron.

## Change Detection

The first job must be `detect-changes` using the `frasermolyneux/actions/detect-changes@main` composite action. Define filters for each category of change the workflow cares about.

### Standard filters

| Filter | Glob | Purpose |
|--------|------|---------|
| `src` | `src/**` | Any source code change — gates build, app deploy, APIM import |
| `terraform` | `terraform/**` | Infrastructure changes — gates whether to plan+apply or just read outputs |
| `database` | `src/<DatabaseProject>/**` | Database project changes — gates SQL deploy (subset of `src`) |

Additional filters can be added for repo-specific concerns (e.g. SCSS, config files) but the above three are the baseline for mixed repos.

### Output wiring

Every filter must be exposed as a job output so downstream jobs can reference it:

```yaml
detect-changes:
  permissions:
    contents: read
  runs-on: ubuntu-latest
  outputs:
    src: ${{ steps.changes.outputs.src }}
    terraform: ${{ steps.changes.outputs.terraform }}
    database: ${{ steps.changes.outputs.database }}
  steps:
    - id: changes
      uses: frasermolyneux/actions/detect-changes@detect-changes/v1.0
      with:
        filters: |
          src:src/**
          terraform:terraform/**
          database:src/<DatabaseProject>/**
```

## Conditional Terraform: plan-and-apply vs output

The terraform job always runs (it must produce outputs for downstream jobs) but uses one of two actions based on the `terraform` flag:

- **`terraform == 'true'`**: Uses `frasermolyneux/actions/terraform-plan-and-apply` — full init, plan, and apply.
- **`terraform != 'true'`**: Uses `frasermolyneux/actions/terraform-output` — init only, connects to remote state so outputs can be read. No plan, no apply.

Both paths leave Terraform initialised against the backend, so the `terraform output -raw` step that follows works identically either way.

```yaml
terraform-plan-and-apply-<env>:
  needs: detect-changes
  steps:
    - if: needs.detect-changes.outputs.terraform == 'true'
      uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.x
      ...

    - if: needs.detect-changes.outputs.terraform != 'true'
      uses: frasermolyneux/actions/terraform-output@terraform-output/v1.x
      ...

    - id: terraform-output-<env>
      shell: bash
      run: |
        cd terraform
        echo "output_name=$(terraform output -raw output_name)" >> $GITHUB_OUTPUT
        ...
```

## Dev Environment State Check (Idempotent Environments)

Development environments are ephemeral — they may be destroyed by `destroy-development.yml` and must be fully rebuilt on the next pipeline run. The `detect-changes` job only inspects git diffs, so when no `.tf` files changed it would skip `terraform-plan-and-apply` and try to read outputs from an empty state, failing the pipeline.

To handle this, add a `terraform-state-check-dev` job that runs the `frasermolyneux/actions/terraform-state-check` action. This action performs `terraform init` then `terraform state list` and outputs `has_resources` (`true`/`false`).

### State-check job

```yaml
terraform-state-check-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  runs-on: ubuntu-latest
  outputs:
    has_resources: ${{ steps.state-check.outputs.has_resources }}
  steps:
    - id: state-check
      uses: frasermolyneux/actions/terraform-state-check@terraform-state-check/v1.0
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### How it changes conditions

The state-check output is combined with `detect-changes` using OR logic. When the dev state is empty (`has_resources != 'true'`), the pipeline behaves as if everything changed — terraform runs plan+apply, the app is built and deployed.

**Terraform job steps:**

```yaml
terraform-plan-and-apply-dev:
  needs:
    - detect-changes
    - terraform-state-check-dev
  steps:
    - if: needs.detect-changes.outputs.terraform == 'true' || needs.terraform-state-check-dev.outputs.has_resources != 'true'
      uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.x
      ...

    - if: needs.detect-changes.outputs.terraform != 'true' && needs.terraform-state-check-dev.outputs.has_resources == 'true'
      uses: frasermolyneux/actions/terraform-output@terraform-output/v1.x
      ...
```

**Build and deploy jobs** — also need to run when dev has no resources:

```yaml
build-and-test:
  needs:
    - detect-changes
    - terraform-state-check-dev
  if: needs.detect-changes.outputs.src == 'true' || needs.terraform-state-check-dev.outputs.has_resources != 'true'

app-service-deploy-dev:
  needs:
    - detect-changes
    - terraform-state-check-dev
    - build-and-test
    - terraform-plan-and-apply-dev
  if: |
    !failure() && !cancelled() &&
    (needs.detect-changes.outputs.src == 'true' || needs.terraform-state-check-dev.outputs.has_resources != 'true')
```

### Prd is not state-checked

Production environments are never destroyed, so no state-check is needed for prd. The prd terraform and deploy jobs continue to use `detect-changes` outputs only. The prd app deploy condition remains `needs.detect-changes.outputs.src == 'true'` without the state-check OR clause.

### Updated dependency chain

```
detect-changes ──────┬── build-and-test (if: src == 'true' || has_resources != 'true')
                     │
terraform-state-check-dev ┘
                     ├── terraform-plan-and-apply-dev (always, step conditions)
                     │     └── app-service-deploy-dev (if: src == 'true' || has_resources != 'true')
                     │           └── terraform-plan-and-apply-prd (if: dev tf success)
                     │                 └── app-service-deploy-prd (if: prd tf success && src == 'true')
```

### Updated scenario matrix

| Scenario | build | tf-dev | app-dev | tf-prd | app-prd |
|---|---|---|---|---|---|
| **Dev destroyed, no changes** | ✅ | plan+apply | ✅ | output | skip |
| Terraform only | skip | plan+apply | skip | plan+apply | skip |
| Src only | ✅ | output | ✅ | output | ✅ |
| All changes | ✅ | plan+apply | ✅ | plan+apply | ✅ |
| schedule/dispatch | ✅ | plan+apply | ✅ | plan+apply | ✅ |

## Job Dependency Chain

The standard chain for each environment is:

```
detect-changes ──┬── build-and-test (if: src == 'true')
                 └── terraform (always)
                       └── deploy-sql (if: database == 'true')
                             └── app-deploy (if: src == 'true')
                                   └── apim-import (if: src == 'true')
```

For the prd environment, each job additionally depends on its dev counterpart to enforce the dev-first deployment order.

## Condition Guards

### Dev jobs

Dev jobs use `!failure() && !cancelled()` combined with the change flag. Since `terraform-plan-and-apply-dev` has no `if` condition (always runs), a failure there naturally propagates via `!failure()` to all downstream dev jobs.

```yaml
if: |
  !failure() && !cancelled() &&
  needs.detect-changes.outputs.<flag> == 'true'
```

### Prd jobs

Prd jobs must additionally assert that `terraform-plan-and-apply-prd` succeeded. This is critical because `terraform-plan-and-apply-prd` has its own `if` condition, so it can be skipped (which `!failure()` alone would not catch — skipped ≠ failure).

```yaml
if: |
  !failure() && !cancelled() &&
  needs.terraform-plan-and-apply-prd.result == 'success' &&
  needs.detect-changes.outputs.<flag> == 'true'
```

### Prd terraform gateway

The prd terraform job is the gateway between environments. It must depend on all dev jobs (so that dev failures block prd) but allow skipped dev jobs (terraform-only changes skip dev deploy jobs). It explicitly checks only that dev terraform succeeded:

```yaml
terraform-plan-and-apply-prd:
  needs:
    - detect-changes
    - terraform-plan-and-apply-dev
    - build-and-test
    - app-service-deploy-v1-dev
    - app-service-deploy-v2-dev
    - apim-api-import-dev
  if: |
    !failure() && !cancelled() &&
    needs.terraform-plan-and-apply-dev.result == 'success'
```

## Scenario Matrix

| Scenario | build | tf-dev | sql-dev | app-dev | tf-prd | sql-prd | app-prd |
|---|---|---|---|---|---|---|---|
| Terraform only | skip | plan+apply | skip | skip | plan+apply | skip | skip |
| Src only (no DB) | ✅ | output | skip | ✅ | output | skip | ✅ |
| Src + database | ✅ | output | ✅ | ✅ | output | ✅ | ✅ |
| All changes | ✅ | plan+apply | ✅ | ✅ | plan+apply | ✅ | ✅ |
| schedule/dispatch | ✅ | plan+apply | ✅ | ✅ | plan+apply | ✅ | ✅ |
| Build fails | ❌ | runs | skip | skip | skip | skip | skip |
| Terraform-dev fails | ✅ | ❌ | skip | skip | skip | skip | skip |

## YAML Style

- Use block-style arrays for `needs`:
  ```yaml
  needs:
    - detect-changes
    - build-and-test
    - terraform-plan-and-apply-dev
  ```
- Do **not** use flow-style arrays: `needs: [a, b, c]`

## Compliance Checklist

When creating or reviewing a `deploy-prd.yml`, verify each item:

1. **detect-changes job exists** — first job, no dependencies, outputs all required change flags
2. **terraform-state-check-dev job exists** — runs in parallel with detect-changes, outputs `has_resources` for the dev environment
3. **Filters are complete** — `src`, `terraform`, and `database` (if a SQL project exists) are all defined
4. **build-and-test uses state-check** — `if: src == 'true' || has_resources != 'true'` so it runs when dev was destroyed
5. **Terraform job always runs** — no `if` on the dev terraform job; uses step-level `if` for plan-and-apply vs output
6. **Terraform steps use state-check** — plan-and-apply runs when `terraform == 'true' || has_resources != 'true'`; output runs when `terraform != 'true' && has_resources == 'true'`
7. **Terraform output step always runs** — no `if` on the `terraform output -raw` step; works after either action
8. **SQL deploy gated on database flag** — not on `src`; avoids unnecessary DACPAC deploys
9. **Dev app deploy uses state-check** — `src == 'true' || has_resources != 'true'` with `!failure() && !cancelled()`
10. **Prd app deploy does NOT use state-check** — only `src == 'true'`; prd is never destroyed
11. **Prd jobs explicitly check terraform-prd success** — `needs.terraform-plan-and-apply-prd.result == 'success'`
12. **Prd terraform depends on all dev jobs** — so dev failures block prd, but uses `!failure() && !cancelled()` to allow skipped dev deploy jobs
13. **Block-style arrays** — all `needs` use YAML block style, not flow style
14. **Concurrency groups are correct** — `${{ github.repository }}-dev` for dev jobs, `${{ github.repository }}-prd` for prd jobs
15. **Workflow-level concurrency** — `group: ${{ github.workflow }}` prevents overlapping runs

## Skip-Dev-on-Schedule (Drift Prevention)

Scheduled runs exist for drift prevention and must only target production. All `deploy-prd.yml` workflows implement the "Option 1" pattern to skip dev jobs on schedule:

1. **Dev-only jobs** (`terraform-state-check-dev`, `terraform-plan-and-apply-dev`, app deploy dev): Add `if: github.event_name != 'schedule'`. If the job already has an `if:`, prepend `github.event_name != 'schedule' &&`.
2. **`build-and-test`** (when it depends on a skippable dev job): Prepend `!failure() && !cancelled() &&` to its `if:` condition so it runs when its dev dependency is skipped.
3. **Prd gateway** (first prd job depending on dev result): Add `|| github.event_name == 'schedule'` to the dev-result check:

```yaml
terraform-plan-and-apply-prd:
  needs:
    - detect-changes
    - terraform-plan-and-apply-dev
    - build-and-test
    - app-service-deploy-dev
  if: |
    !failure() && !cancelled() &&
    (needs.terraform-plan-and-apply-dev.result == 'success' || github.event_name == 'schedule')
```

### Why this works

- Skipped dev jobs have `result == 'skipped'`, not `'success'`.
- `!failure() && !cancelled()` passes for skipped upstream jobs, allowing `build-and-test` and other non-dev jobs to proceed.
- The `|| github.event_name == 'schedule'` fallback lets the prd gateway bypass the dev-success check on scheduled runs.
- The `detect-changes` action forces all outputs to `true` on schedule, so prd conditions based on change flags still pass.

### Terraform-only repos

For Terraform-only repos (e.g. `portal-environments`, `portal-core`), the pattern is simpler — just add `if: github.event_name != 'schedule'` to `terraform-plan-and-apply-dev`, and add the schedule fallback to the prd job's `if:`.

## Terraform-only Repos (paths filter alternative)

Repos with **no source code** (only `terraform/`) do not need the full detect-changes pattern. They should use `paths:` filters on the trigger instead:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'terraform/**'
      - '.github/workflows/deploy-prd.yml'
```

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
    - cron: "0 3 * * 4"
```

- No `paths:` filter — change detection is handled at runtime by the `detect-changes` job.
- `workflow_dispatch` and `schedule` triggers force all change flags to `true` (built into the `detect-changes` action).

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
2. **Filters are complete** — `src`, `terraform`, and `database` (if a SQL project exists) are all defined
3. **build-and-test is conditional** — `if: needs.detect-changes.outputs.src == 'true'`
4. **Terraform job always runs** — no `if` on the dev terraform job; uses step-level `if` for plan-and-apply vs output
5. **Terraform output step always runs** — no `if` on the `terraform output -raw` step; works after either action
6. **SQL deploy gated on database flag** — not on `src`; avoids unnecessary DACPAC deploys
7. **App deploy and APIM gated on src flag** — with `!failure() && !cancelled()` to allow skipped SQL deploy
8. **Prd jobs explicitly check terraform-prd success** — `needs.terraform-plan-and-apply-prd.result == 'success'`
9. **Prd terraform depends on all dev jobs** — so dev failures block prd, but uses `!failure() && !cancelled()` to allow skipped dev deploy jobs
10. **Block-style arrays** — all `needs` use YAML block style, not flow style
11. **Concurrency groups are correct** — `${{ github.repository }}-dev` for dev jobs, `${{ github.repository }}-prd` for prd jobs
12. **Workflow-level concurrency** — `group: ${{ github.workflow }}` prevents overlapping runs

## Terraform-only Repos

Repos with **no source code** (only `terraform/`) do not need this pattern. They should use `paths:` filters on the trigger instead:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'terraform/**'
      - '.github/workflows/deploy-prd.yml'
```

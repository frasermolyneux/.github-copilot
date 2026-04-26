---
description: Canonical pattern for the Deploy Prd workflow — change-detected, environment-promoted production deploy with weekly drift run. Layered on top of workflows.terraform.instructions.md, workflows.dotnet.instructions.md, workflows.scheduling.instructions.md, and workflows.frasermolyneux-actions.instructions.md.
applyTo: '**/deploy-prd.yml'
---

# `deploy-prd.yml` Pattern

Production deployment workflow. Triggered by push to `main`, manual `workflow_dispatch`, and a weekly drift-prevention `schedule`. Uses runtime change-detection so jobs only run when their inputs changed, with a state-check escape hatch for nightly-destroyed dev environments.

## Applicability

All repos with a `Production` environment to deploy. Bespoke workflows (listed in `workflows.instructions.md`) are out of scope — they have no canonical template.

## Triggers

```yaml
name: Deploy Prd

on:
  push:
    branches:
      - main
  workflow_dispatch:
  schedule:
    - cron: "0 X * * D"   # See ops clock for this repo's allocated slot

permissions: {}

concurrency:
  group: ${{ github.workflow }}
```

The schedule is for production drift prevention only — see [Skip-dev-on-schedule](#skip-dev-on-schedule) below. The slot comes from `docs/ops-clock.md` (`workflows.scheduling.instructions.md`).

## Change detection (always the first job)

Use `frasermolyneux/actions/detect-changes`. On `workflow_dispatch` or `schedule` the action forces all outputs to `true`.

### Standard filters

| Filter | Glob | Gates |
|---|---|---|
| `src` | `src/**` | build, app deploy, APIM import |
| `terraform` | `terraform/**` | plan+apply vs output |
| `database` | `src/<DatabaseProject>/**` | SQL deploy (subset of `src`) |

Repos can add filters (SCSS, configs) but the above three are the baseline for mixed repos.

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

## Conditional Terraform job

The Terraform job always runs (it must produce outputs for downstream jobs) but switches actions based on the `terraform` flag and the dev state-check (see below):

```yaml
- if: needs.detect-changes.outputs.terraform == 'true' || needs.terraform-state-check-dev.outputs.has_resources != 'true'
  uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
  ...

- if: needs.detect-changes.outputs.terraform != 'true' && needs.terraform-state-check-dev.outputs.has_resources == 'true'
  uses: frasermolyneux/actions/terraform-output@terraform-output/v1.0
  ...

- id: terraform-output-<env>
  shell: bash
  run: |
    cd terraform
    echo "name=$(terraform output -raw name)" >> $GITHUB_OUTPUT
    ...
```

Both actions leave terraform initialised against the backend, so the `terraform output -raw` step works either way. Composite versions: see `workflows.frasermolyneux-actions.instructions.md`.

## Dev state check (idempotent dev environments)

Dev is wiped nightly by `destroy-development.yml`, so a deploy with no `.tf` diff would otherwise fail trying to read outputs from empty state. Add a `terraform-state-check-dev` job in parallel with `detect-changes`:

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
      uses: frasermolyneux/actions/terraform-state-check@terraform-state-check/v1.1
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

Then OR `has_resources != 'true'` into the conditions for every dev-stage job:

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

**Never state-check prd** — production is permanent. Prd app deploy stays gated on `src == 'true'` only.

## Job dependency chain

```
detect-changes ────────────┬── build-and-test (if: src='true' || has_resources!='true')
terraform-state-check-dev ─┘     │
                                 ├── terraform-plan-and-apply-dev (always, step conditions)
                                 │     └── app-service-deploy-dev (src || !has_resources)
                                 │           └── terraform-plan-and-apply-prd (if: dev tf success)
                                 │                 └── app-service-deploy-prd (prd tf success && src='true')
```

## Condition guards

### Dev jobs

```yaml
if: |
  !failure() && !cancelled() &&
  needs.detect-changes.outputs.<flag> == 'true'
```

### Prd jobs

Prd jobs must explicitly check that prd Terraform succeeded — `terraform-plan-and-apply-prd` has its own `if:`, so it can be skipped (and `!failure()` alone treats skipped as OK):

```yaml
if: |
  !failure() && !cancelled() &&
  needs.terraform-plan-and-apply-prd.result == 'success' &&
  needs.detect-changes.outputs.<flag> == 'true'
```

### Prd terraform gateway

Depends on all dev jobs (so dev failures block prd) but allows skipped dev deploy jobs (terraform-only changes skip dev deploy):

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
    (needs.terraform-plan-and-apply-dev.result == 'success' || github.event_name == 'schedule')
```

## Skip-dev-on-schedule

See `workflows.scheduling.instructions.md` for the canonical pattern. Summary:

1. Dev-only jobs add `if: github.event_name != 'schedule'` (or prepend it to existing `if:`).
2. `build-and-test` (when depending on a skippable dev job) prepends `!failure() && !cancelled() &&`.
3. Prd gateway adds `|| github.event_name == 'schedule'` to its dev-result check.

## Scenario matrix

| Scenario | build | tf-dev | sql-dev | app-dev | tf-prd | sql-prd | app-prd |
|---|---|---|---|---|---|---|---|
| Dev destroyed, no changes | ✅ | plan+apply | skip | ✅ | output | skip | skip |
| Terraform only | skip | plan+apply | skip | skip | plan+apply | skip | skip |
| Src only (no DB) | ✅ | output | skip | ✅ | output | skip | ✅ |
| Src + database | ✅ | output | ✅ | ✅ | output | ✅ | ✅ |
| All changes | ✅ | plan+apply | ✅ | ✅ | plan+apply | ✅ | ✅ |
| schedule / dispatch | ✅ | plan+apply | ✅ | ✅ | plan+apply | ✅ | ✅ |
| Build fails | ❌ | runs | skip | skip | skip | skip | skip |
| Terraform-dev fails | ✅ | ❌ | skip | skip | skip | skip | skip |

## Terraform-only repos (paths-filter shortcut)

Repos with no source code use `paths:` on the trigger instead of `detect-changes`:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
      - '.github/workflows/deploy-prd.yml'
  workflow_dispatch:
  schedule:
    - cron: "0 X * * D"
```

These still need `terraform-state-check-dev` and skip-dev-on-schedule.

## Static Web App repos

Static Web App prd workflows replace the App Service / Function deploy jobs with a SWA deploy job per environment. The detect-changes filters reduce to `src` and `terraform` (no `database`). The dependency chain becomes:

```
detect-changes ──┐
terraform-state-check-dev ──┐
                            ├─► build-and-test ──┐
                            ├─► terraform-plan-and-apply-dev ──┤
                                                               ├─► static-web-app-deploy-dev ──┐
                                                                                               ├─► terraform-plan-and-apply-prd ──┐
                                                                                                                                  └─► static-web-app-deploy-prd
```

### Dev SWA deploy job

Same shape as documented in `workflows.deploy-dev.instructions.md` (Static Web App section) — that template applies unchanged here. The job's `if:` gains the prd-style state-check guard:

```yaml
if: |
  github.event_name != 'schedule' &&
  !failure() && !cancelled() &&
  (needs.detect-changes.outputs.src == 'true' || needs.terraform-state-check-dev.outputs.state_tainted == 'true')
```

### Prd terraform job (with SWA output)

Same conditional pattern as the standard prd terraform job (plan-and-apply when `terraform == 'true'`, otherwise `terraform-output`), plus a final `terraform-output` step exposing `static_web_app_name`:

```yaml
terraform-plan-and-apply-prd:
  permissions:
    contents: read
    id-token: write
  environment: Production
  needs:
    - detect-changes
    - build-and-test
    - terraform-plan-and-apply-dev
    - static-web-app-deploy-dev
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-prd
  if: |
    !failure() && !cancelled() &&
    (needs.terraform-plan-and-apply-dev.result == 'success' || github.event_name == 'schedule')
  steps:
    - if: needs.detect-changes.outputs.terraform == 'true'
      uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/prd.tfvars"
        terraform-backend-file: "backends/prd.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

    - if: needs.detect-changes.outputs.terraform != 'true'
      uses: frasermolyneux/actions/terraform-output@terraform-output/v1.0
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/prd.tfvars"
        terraform-backend-file: "backends/prd.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

    - id: terraform-output
      shell: bash
      run: |
        cd terraform
        echo "static_web_app_name=$(terraform output -raw static_web_app_name)" >> $GITHUB_OUTPUT
      env:
        ARM_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        ARM_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
        ARM_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        ARM_USE_AZUREAD: true
        ARM_USE_OIDC: true

  outputs:
    static_web_app_name: ${{ steps.terraform-output.outputs.static_web_app_name }}
```

### Prd SWA deploy job

```yaml
static-web-app-deploy-prd:
  permissions:
    contents: read
    id-token: write
  environment: Production
  needs:
    - detect-changes
    - build-and-test
    - terraform-plan-and-apply-prd
    - static-web-app-deploy-dev
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-prd
  if: |
    !failure() && !cancelled() &&
    needs.terraform-plan-and-apply-prd.result == 'success' &&
    needs.detect-changes.outputs.src == 'true'
  steps:
    - name: Download site artifact
      uses: actions/download-artifact@v7
      with:
        name: static-site
        path: static-site

    - name: Az CLI Login
      uses: azure/login@v3
      with:
        client-id: ${{ vars.AZURE_CLIENT_ID }}
        subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
        tenant-id: ${{ vars.AZURE_TENANT_ID }}

    - id: static-web-app-api-key
      uses: azure/CLI@v2
      with:
        inlineScript: |
          static_web_app_api_key=$(az staticwebapp secrets list -n ${{ needs.terraform-plan-and-apply-prd.outputs.static_web_app_name }} -o tsv --query properties.apiKey)
          echo "::add-mask::$static_web_app_api_key"
          echo static_web_app_api_key=$static_web_app_api_key >> $GITHUB_ENV

    - id: deploy-static-web-app
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ env.static_web_app_api_key }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: upload
        app_location: static-site
        skip_app_build: true
```

### SWA-specific compliance notes

- Prd SWA deploy is gated on `src == 'true'` only (no state-check, same rule as standard prd app deploys).
- Both prd jobs `needs:` `static-web-app-deploy-dev` so a failed dev SWA deploy blocks prd promotion.
- Build job is build-system-agnostic (Node + npm, Ruby + Jekyll, or any other static-site generator); only the artefact contract matters — upload `static-site` containing the built site.

## Compliance checklist

1. **`detect-changes` job exists** — first job, no dependencies, outputs all required change flags.
2. **`terraform-state-check-dev` job exists** — runs in parallel with `detect-changes`, outputs `has_resources`.
3. **Filters complete** — `src`, `terraform`, and `database` (if a SQL project exists) all defined.
4. **`build-and-test` uses state-check** — `if: src == 'true' || has_resources != 'true'`.
5. **Dev terraform job always runs** — no `if:` on the job; uses step-level `if` for plan-and-apply vs output.
6. **Terraform steps use state-check** — plan-and-apply runs when `terraform == 'true' || has_resources != 'true'`; output runs otherwise.
7. **Terraform `output -raw` step always runs** — works after either action.
8. **SQL deploy gated on `database` flag** — not on `src`.
9. **Dev app deploy uses state-check** — `src == 'true' || has_resources != 'true'` with `!failure() && !cancelled()`.
10. **Prd app deploy does NOT use state-check** — only `src == 'true'`.
11. **Prd jobs check `terraform-plan-and-apply-prd.result == 'success'`**.
12. **Prd terraform depends on all dev jobs** — uses `!failure() && !cancelled()` to allow skipped dev deploys.
13. **Block-style `needs:`** arrays everywhere.
14. **Concurrency** — `${{ github.repository }}-<env>` per env-bound job; workflow-level `${{ github.workflow }}` set.
15. **Skip-dev-on-schedule** wired correctly (dev `if: github.event_name != 'schedule'`, prd gateway `|| github.event_name == 'schedule'`).

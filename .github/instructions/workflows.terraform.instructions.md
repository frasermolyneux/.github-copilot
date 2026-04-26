---
description: Conventions for any GitHub Actions workflow that interacts with Terraform infrastructure (plan, apply, output, state-check, destroy, decommission). Layered on top of workflows.instructions.md and workflows.frasermolyneux-actions.instructions.md.
applyTo: '.github/workflows/{deploy-dev,deploy-prd,destroy-development,destroy-environment,pr-verify,build-and-test,feature-development,decommission-state-rm,update-dashboard-from-staging}.yml'
---

# Terraform Workflow Conventions

Applies whenever a workflow touches Terraform — typically `pr-verify`, `build-and-test`, `deploy-dev`, `deploy-prd`, `destroy-environment`, `destroy-development`, plus a few bespoke workflows. Composite-action references use the pinned tags from `workflows.frasermolyneux-actions.instructions.md`.

## Repository layout

Terraform-bearing repos use this layout:

```
terraform/
  *.tf                     # root module
  tfvars/
    dev.tfvars
    prd.tfvars
  backends/
    dev.backend.hcl
    prd.backend.hcl
```

Workflow inputs always reference these paths verbatim:

```yaml
terraform-folder: "terraform"
terraform-var-file: "tfvars/<env>.tfvars"
terraform-backend-file: "backends/<env>.backend.hcl"
```

## GitHub environments

- `Development` — used for `dev`-suffixed jobs.
- `Production` — used for `prd`-suffixed jobs; should be configured with required reviewers in GitHub.

Map dynamically when one workflow handles both environments:

```yaml
environment: ${{ inputs.environment == 'prd' && 'Production' || 'Development' }}
```

## Concurrency

Every Terraform-touching job sets:

```yaml
concurrency:
  group: ${{ github.repository }}-<env>
```

This prevents two workflows from racing on the same backend state file.

## Permissions

Standard for any job calling Terraform composites:

```yaml
permissions:
  contents: read
  id-token: write
```

Add `pull-requests: write` if the job posts a plan comment (e.g. `pr-verify` Terraform plan).

## Action selection

| Situation | Action |
|---|---|
| PR plan with comment | `terraform-plan` |
| Build/test branch (no comment) | `terraform-plan` |
| Deploy environment with apply | `terraform-plan-and-apply` |
| Read outputs only (no changes detected) | `terraform-output` |
| Verify dev env still has resources | `terraform-state-check` |
| Destroy an environment | `terraform-destroy` |
| Detach a workload from state | `terraform-state-rm` |

## Conditional plan/apply pattern

In `deploy-prd.yml` (and `deploy-dev.yml` for state-checked repos), the Terraform job runs unconditionally but switches between `terraform-plan-and-apply` and `terraform-output` based on the `detect-changes` flag:

```yaml
- if: needs.detect-changes.outputs.terraform == 'true'
  uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
- if: needs.detect-changes.outputs.terraform != 'true'
  uses: frasermolyneux/actions/terraform-output@terraform-output/v1.0
```

Both leave the working dir initialised so the `terraform output -raw` step works either way. See `workflows.deploy-prd.instructions.md` for the full pattern.

## `terraform-state-check-dev` (idempotent dev environments)

Dev environments are destroyed nightly by `destroy-development.yml`, so any deploy must rebuild from scratch when state is empty. Add a `terraform-state-check-dev` job in parallel with `detect-changes` and OR its `has_resources != 'true'` output into the change conditions for dev jobs. **Never** state-check prd — production is permanent.

See `workflows.deploy-prd.instructions.md` for the full state-check wiring.

## Terraform-only repos (`paths:` filter shortcut)

Terraform-only repos (no `src/` folder) skip the `detect-changes` machinery and use trigger-level `paths:`:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
      - '.github/workflows/deploy-prd.yml'
```

These repos still need `terraform-state-check-dev` for dev (because nightly destroy still applies), and still implement skip-dev-on-schedule.

## `nbgv-metadata` is not Terraform

Nerdbank.GitVersioning composite is a .NET concern — see `workflows.dotnet.instructions.md`.

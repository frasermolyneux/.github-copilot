---
description: "Automatic baseline conventions for Terraform, tfvars, and backend configuration files."
applyTo: '**/*.tf,**/*.tfvars,**/backends/*.hcl'
---

# Terraform Conventions

These conventions apply to every repository in the org that contains Terraform code (platform stacks, portal ecosystem stacks, and app-embedded IaC). Repository-specific guidance lives in each repo's `.github/copilot-instructions.md`.

## Repository Layout

Every Terraform stack uses the same root-module layout under `terraform/` (some repos have additional roots such as `terraform-sub/` for subscription-level resources; they follow the same per-root conventions).

- `terraform/providers.tf` — Terraform and provider version constraints, `azurerm` backend block.
- `terraform/variables.tf` — Input variables (`environment`, `workload_name`, `location`, `subscription_id`, `tags`, plus stack-specific inputs).
- `terraform/locals.tf` — Naming, location normalisation, resource-group lookup, tag merging.
- `terraform/remote_state.tf` — `terraform_remote_state` data source(s) for upstream stacks (only present in stacks that consume upstream outputs).
- `terraform/outputs.tf` — Outputs consumed by downstream stacks (omit only if nothing is consumed downstream).
- `terraform/backends/` — Per-environment backend configs (`dev.backend.hcl`, `prd.backend.hcl`).
- `terraform/tfvars/` — Per-environment variable files (`dev.tfvars`, `prd.tfvars`).
- One `.tf` file per resource type or cohesive logical concern (`app_service_plan.tf`, `container_registry.tf`, etc.). Domain-grouped files (e.g. `azure-workloads.*.tf`) are acceptable when a concern spans many resources.

## Provider Requirements

Keep compatibility constraints in `providers.tf`; commit the exact selected CLI
in each root's `.terraform-version` and provider selections/checksums in that
root's `.terraform.lock.hcl`. A constraint is not an installed version.

- Select the root CLI pin before invoking Terraform, including local `-chdir` commands.
- Preserve the repository's reviewed provider constraints and authentication ceilings;
  the estate currently uses AzureRM 5.x, not the obsolete 4.x baseline.
- Declare only providers actually needed. Reusable child modules do not own deployment locks.
- Normal initialization uses `-lockfile=readonly`, never `-upgrade`.
- Regenerate locks only in a reviewed dependency-update PR using `init -upgrade`
  and `providers lock -platform=linux_amd64 -platform=windows_amd64`; review both
  development and production plans before merging.
- Dependabot owns provider/module version-update PRs for every root. It does not
  update `.terraform-version`, and Terraform security updates are not supported.
  The scoped `platform-devex` controller proposes approved CLI patch updates;
  minor-line changes require a reviewed controller-policy change.
- Terraform/toolchain updates require deliberate review, including updates grouped
  with otherwise auto-mergeable dependencies. Radar monitors official security and
  release intelligence independently of the weekly update schedule.
- Backend: `azurerm` (Azure Blob) with `storage_use_azuread = true`
- Authentication: OIDC — workflows set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. Backend `.hcl` files include `use_oidc = true`, `use_azuread_auth = true`, and `tenant_id`.

Provider locks do not lock remote modules: pin registry modules to exact versions
and Git modules to immutable commit references when introducing them.

The shared v2 Terraform actions require pins/locks and publish bounded execution
receipts. Source selections, validation/plan observations, successful environment
applies and teardown are different evidence. A CI tool is not an application runtime;
a newly merged pin does not prove the last deployment used it. Never publish state,
plans, outputs, tfvars, backend values, environment dumps or credentials as receipts.

Radar currently verifies static main-branch callers of the versioned operation
wrappers with literal roots and environment identity. Matrix callers and
standalone receipt-helper calls remain explicitly unsupported; do not add those
producers merely to manufacture Radar coverage.

## Standard Variables

- `workload_name` — always use this name (not `workload`). The value matches the repository name (e.g. `platform-hosting`, `geo-location`).
- `environment` — typically `dev` or `prd`.
- `location` — `swedencentral` for new workloads (dev and prd) and all dev environments; `uksouth` for existing prd. See `tenant.regions.instructions.md`.
- `subscription_id` — required (no default).
- `tags` — map; merged with computed tags in `locals.tf`.

## Remote State Pattern

Stacks that depend on shared org infrastructure consume `platform-workloads` remote state for resource groups and identity configuration. The pattern:

- Defined in `terraform/remote_state.tf` as a `terraform_remote_state` data source with `use_oidc = true` in its `config` block.
- Resolved through `terraform/locals.tf` (e.g. resource-group lookup by location key).
- `platform-workloads` is the origin of this state and does not consume it.
- Downstream stacks may add their own `terraform_remote_state` references (e.g. `platform-monitoring` for action groups, `platform-connectivity` for DNS, `portal-environments` for portal-app config).

## Local Validation Commands

```bash
# First install/select the version in terraform/.terraform-version.
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform init -backend=false -input=false -lockfile=readonly
terraform -chdir=terraform validate
```

Repeat for each auxiliary root using its own pin and lock. Run state-backed
environment plans through the protected PR workflows with matching backend and
tfvars files; production-only stacks use their existing production route.

## Conventions

- Run `terraform fmt -recursive` before every commit.
- Run backend-disabled validation locally; use the existing OIDC PR workflows for
  environment-backed plans and preserve their environment/review gates.
- Never apply directly from a local machine — all changes flow through GitHub Actions workflows.
- One resource type per `.tf` file (preferred); use `data.*` prefix or a dedicated file for data-source-only files.
- Use `locals` for computed values; avoid hardcoding resource names.
- Always set `tags` on every taggable resource (either `tags = var.tags` or `tags = local.resource_tags` after merging).
- Expose new resource identifiers via `outputs.tf` if downstream stacks may consume them.
- Prefer extending map-driven inputs in `tfvars/*.tfvars` (e.g. `app_service_plans`, `dns_zones`) over duplicating resources.
- Provider authentication for local development uses Azure CLI login; CI uses OIDC.

## Resource Naming and Tagging

- Naming follows `{resource}-{workload_name}-{environment}-{location}-{instance}`.
- Globally unique resources append `random_id.environment_id.hex` (or similar) instead of a static instance suffix.
- Tags include at least `Environment` and `Workload`; additional tags (`DeployedBy`, `Git`) are commonly applied via `tfvars`.
- Keep names and locations lowercase.

## CI/CD Workflow Pattern

All Terraform stacks consume the standard workflow set from `frasermolyneux/actions`:

- `build-and-test.yml` — Plan against Dev on `feature/*`, `bugfix/*`, `hotfix/*` branch pushes.
- `pr-verify.yml` — Plan against Dev on PRs; Prd plan added when the PR carries the `run-prd-plan` label.
- `deploy-dev.yml` — Manual dispatch for Dev plan and apply.
- `deploy-prd.yml` — Push to `main`, weekly schedule, or manual dispatch; runs Dev apply then Prd apply.
- `destroy-development.yml` / `destroy-environment.yml` — Manual teardown.
- `codequality.yml`, `dependabot-automerge.yml` — Maintenance.
- `copilot-setup-steps.yml` — Optional pre-agent prerequisites only; omit when the normal runner is sufficient.

See the org-level `copilot-instructions.md` and `.github/instructions/workflows.deploy-prd.instructions.md` for scheduling rules.

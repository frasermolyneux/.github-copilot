---
description: Catalog of frasermolyneux/actions composite actions and reusable workflows, with the canonical pinned versions. Use this as the single source of truth for action references — per-workflow instructions reference this file rather than duplicating versions.
applyTo: '.github/workflows/**/*.yml'
---

# `frasermolyneux/actions` Catalog

All workflows consume composite actions and reusable workflows from the `frasermolyneux/actions` repository. This file is the single source of truth for the canonical pinned tags.

## Pinning policy

- **Always pin to the specific tag**, e.g. `@dotnet-ci/v1.4`. Never use `@main` or floating refs.
- Reusable workflows (`uses: frasermolyneux/actions/.github/workflows/<name>.yml@<ref>`) currently pin to `@main` because they are versioned by the catalog repo's main branch — this is the documented exception.
- When bumping a tag, update this file once and propagate to every Layer-3 instruction that references it.

## Composite actions

| Action | Pinned tag | Purpose |
|---|---|---|
| `frasermolyneux/actions/dotnet-ci` | `@dotnet-ci/v1.4` | Restore, build, test, package a .NET solution |
| `frasermolyneux/actions/dotnet-web-ci` | `@dotnet-web-ci/v1.4` | Build & publish a .NET web app project |
| `frasermolyneux/actions/dotnet-func-ci` | `@dotnet-func-ci/v1.4` | Build & publish a .NET Azure Functions project |
| `frasermolyneux/actions/terraform-plan` | `@terraform-plan/v1.4` | `init` + `validate` + `plan`, with PR commenting |
| `frasermolyneux/actions/terraform-plan-and-apply` | `@terraform-plan-and-apply/v1.4` | Full `init` + `plan` + `apply` |
| `frasermolyneux/actions/terraform-output` | `@terraform-output/v1.0` | `init` against backend so outputs can be read (no plan/apply) |
| `frasermolyneux/actions/terraform-state-check` | `@terraform-state-check/v1.1` | `terraform state list`; outputs `has_resources` (true/false) |
| `frasermolyneux/actions/terraform-state-rm` | `@terraform-state-rm/v1.2` | `terraform state rm` for decommissioning |
| `frasermolyneux/actions/terraform-destroy` | `@terraform-destroy/v1.2` | `terraform destroy` for an environment |
| `frasermolyneux/actions/detect-changes` | `@detect-changes/v1.0` | Path-filter detection; forces all outputs to `true` on schedule/dispatch |
| `frasermolyneux/actions/deploy-app-service` | `@deploy-app-service/v1.2` | Deploy a built artifact to an App Service |
| `frasermolyneux/actions/deploy-function-app` | `@deploy-function-app/v1.2` | Deploy a built artifact to a Function App |
| `frasermolyneux/actions/deploy-sql-database` | `@deploy-sql-database/v1.3` | Deploy a DACPAC to Azure SQL |
| `frasermolyneux/actions/publish-nuget-packages` | `@publish-nuget-packages/v2.0` | Download artifact + push to NuGet.org |
| `frasermolyneux/actions/nbgv-metadata` | `@nbgv-metadata/v1` | Export Nerdbank.GitVersioning build metadata |
| `frasermolyneux/actions/wait-for-version` | `@wait-for-version/v1.0` | Poll an `info-url` until `expected-version` is live |
| `frasermolyneux/actions/apim-api-import` | `@apim-api-import/v1.0` | Import an OpenAPI definition into Azure API Management |
| `frasermolyneux/actions/dotnet-playwright-tests` | `@dotnet-playwright-tests/v1.1` | Run Playwright end-to-end tests against a deployed .NET app |

## Reusable workflows

| Workflow | Ref | Purpose |
|---|---|---|
| `frasermolyneux/actions/.github/workflows/codequality.yml` | `@main` | Sonar + build for codequality scans |
| `frasermolyneux/actions/.github/workflows/devops-secure-scanning.yml` | `@main` | DevSkim, Trivy, CodeQL bundle |

## Azure identity passing

All Azure-touching composites require these three inputs (sourced from `vars`, never `secrets`):

```yaml
AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

Any job using these composites must declare `permissions.id-token: write` for OIDC.

## Terraform output extraction

After `terraform-plan-and-apply` or `terraform-output`, terraform is left initialised against the backend. Read outputs with a follow-up step:

```yaml
- id: terraform-output
  shell: bash
  run: |
    cd terraform
    echo "name=$(terraform output -raw name)" >> $GITHUB_OUTPUT
  env:
    ARM_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
    ARM_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
    ARM_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
    ARM_USE_AZUREAD: true
    ARM_USE_OIDC: true
```

Always declare the output at the job level so downstream jobs can consume it.

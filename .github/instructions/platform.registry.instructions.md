---
description: Consumption contract for platform-registry — shared Azure Container Registry and published Bicep modules.
applyTo: '**/*.tf,**/*.tfvars,.github/workflows/**/*.yml'
---
# platform-registry — Consumer Contract

Hosts the shared **Azure Container Registry** and publishes reusable **Bicep modules** versioned via Nerdbank.GitVersioning.

## What it provides

- Azure Container Registry (shared, admin-disabled)
- Bicep modules published to `{login_server}/bicep/{module-name}:{version}` (15+ modules including `apiManagementLogger`, `keyVault`, `storageAccount`, `sqlDatabase`, `frontDoor`, `appInsights`)

## Terraform outputs

| Output | Shape |
|---|---|
| `acr` | `object({ id, name, login_server })` |

## State backend

| Env | Resource Group | Storage Account |
|---|---|---|
| dev | `rg-tf-platform-registry-dev-uksouth-01` | `sa51a3686234c8` |
| prd | `rg-tf-platform-registry-prd-uksouth-01` | `sa258ed87734b4` |

Container `tfstate`, key `terraform.tfstate`, subscription `7760848c-794d-4a19-8cb2-52f71a21ac2b`.

## Consumer wiring (Terraform → Bicep modules)

```hcl
data "terraform_remote_state" "platform_registry" {
  backend = "azurerm"
  config = {
    resource_group_name  = var.platform_registry_state.resource_group_name
    storage_account_name = var.platform_registry_state.storage_account_name
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
    use_oidc             = true
    subscription_id      = var.platform_registry_state.subscription_id
    tenant_id            = var.platform_registry_state.tenant_id
  }
}

locals {
  acr_login_server = data.terraform_remote_state.platform_registry.outputs.acr.login_server
}
```

## Consumer wiring (Bicep module reference)

```bicep
module appInsights 'br:acrkeyword.azurecr.io/bicep/appInsights:V1.x' = {
  name: 'appInsights'
  params: { /* ... */ }
}
```

Use the `V<major>.x` moving tag for automatic minor/patch updates within a major version.

## Special conventions

- **Module path**: `br:{login_server}/bicep/{module-name}:{version}` for Bicep `module` references.
- **Versioning**: each module folder has its own `version.json` with `pathFilters`, so module versions advance independently. Published tags per module: `V{X.Y.Z}`, `V{X}.x`, `V{X.Y}.x`, and `latest`.
- **Pin to `V<major>.x`** in consumers — gives auto-uptake of compatible changes; pin to `V{X.Y.Z}` only when reproducibility matters.
- Admin user is disabled — pulls authenticate via Azure RBAC (managed identity / OIDC), not username/password.
- Module catalogue lives in `platform-registry/modules/`; each module is a folder with `main.bicep` and `version.json`.

## Documentation

- `platform-registry/README.md` — list of all published modules with descriptions

## Cross-references

- `patterns.terraform-remote-state.instructions.md` — remote-state wiring pattern
- `patterns.nbgv-versioning.instructions.md` — versioning model used by each module

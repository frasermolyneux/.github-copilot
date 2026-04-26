---
description: Consumption contract for platform-hosting — shared Azure App Service Plans.
applyTo: '**/*.tf,**/*.tfvars'
---
# platform-hosting — Consumer Contract

Provisions shared **App Service Plans** for downstream workloads, map-driven via Terraform variables. Resource groups are pulled from `platform-workloads` state.

## What it provides

- Azure App Service Plans (map-driven, per workload, per environment, per location)

## Terraform outputs

| Output | Shape |
|---|---|
| `app_service_plans` | `map(object({ id, name, resource_group_name, location, sku, os_type }))` keyed by plan key |

## State backend

| Env | Resource Group | Storage Account |
|---|---|---|
| dev | `rg-tf-platform-hosting-dev-uksouth-01` | `saa3efe8753ccf` |
| prd | `rg-tf-platform-hosting-prd-uksouth-01` | `sab227d365059d` |

Container `tfstate`, key `terraform.tfstate`, subscription `7760848c-794d-4a19-8cb2-52f71a21ac2b`.

## Consumer wiring

```hcl
data "terraform_remote_state" "platform_hosting" {
  backend = "azurerm"
  config = {
    resource_group_name  = var.platform_hosting_state.resource_group_name
    storage_account_name = var.platform_hosting_state.storage_account_name
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
    use_oidc             = true
    subscription_id      = var.platform_hosting_state.subscription_id
    tenant_id            = var.platform_hosting_state.tenant_id
  }
}

locals {
  plans = data.terraform_remote_state.platform_hosting.outputs.app_service_plans
}

resource "azurerm_linux_web_app" "app" {
  name                = "app-myworkload-prd-uks-01"
  resource_group_name = local.workload_rg.name
  location            = local.workload_rg.location
  service_plan_id     = local.plans["web-linux"].id
  # ...
}
```

## Special conventions

- **Plan naming**: `asp-{workload}-{environment}-{location}-{key}` (declared in the `app_service_plans` Terraform variable on the `platform-hosting` side).
- **Plan keys** identify use-case (e.g. `web-linux`, `api-windows`); a workload picks the plan matching its hosting need.
- Plan locations must match the workload's locations — `platform-hosting` allocates one plan per workload/environment/location.
- Resource groups are sourced from `platform-workloads` state; do not create web apps in unrelated resource groups.
- To add a new plan SKU/key for a workload, raise a PR to `platform-hosting` updating the `app_service_plans` map.

## Documentation

- `platform-hosting/docs/development-workflows.md` — branch strategy and environment promotion

## Cross-references

- `platform.workloads.instructions.md` — resource groups source
- `patterns.terraform-remote-state.instructions.md` — remote-state wiring pattern
- `standards.azure-naming.instructions.md` — naming convention for the consumer's web app

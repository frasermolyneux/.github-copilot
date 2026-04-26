---
description: Consumption contract for portal-core — shared Terraform infrastructure (App Insights, App Service Plans, SQL Server, Service Bus) for portal-* repos.
applyTo: '**/*.tf,**/*.tfvars,**/*.cs,**/*.csproj'
---
# portal-core — Consumer Contract

Provisions shared Terraform infrastructure for the **portal-\*** family of repos: Application Insights, App Service Plans, Azure SQL Server, Service Bus namespace + queues, dashboards, and resource-health alerts.

## What it provides

- Azure Application Insights (with role assignments)
- App Service Plans (keyed map, by tier/OS)
- Azure SQL Server with managed identity
- Service Bus namespace + queues (with role assignments)
- Portal dashboards (dev/prd variants)
- Resource-health alerts routed to platform-monitoring action groups

## Terraform outputs

| Output | Shape |
|---|---|
| `staging_dashboard_name` | string (dev) |
| `app_insights` | `object({ id, name, resource_group_name, location })` |
| `app_service_plans` | `map(object({ id, name, resource_group_name, location, sku, os_type }))` keyed by plan key |
| `sql_server` | `object({ id, name, resource_group_name, location, fqdn })` |
| `servicebus_namespace` | `object({ id, name, resource_group_name, location, fqdn })` |
| `servicebus_queues` | `map(object({ id, name }))` keyed by queue name |

## Consumer wiring

```hcl
variable "portal_core_state" {
  type = object({
    resource_group_name  = string
    storage_account_name = string
    container_name       = string
    key                  = string
    subscription_id      = string
    tenant_id            = string
  })
}

data "terraform_remote_state" "portal_core" {
  backend = "azurerm"
  config = {
    resource_group_name  = var.portal_core_state.resource_group_name
    storage_account_name = var.portal_core_state.storage_account_name
    container_name       = var.portal_core_state.container_name
    key                  = var.portal_core_state.key
    use_oidc             = true
    subscription_id      = var.portal_core_state.subscription_id
    tenant_id            = var.portal_core_state.tenant_id
  }
}

locals {
  app_insights_id           = data.terraform_remote_state.portal_core.outputs.app_insights.id
  app_service_plan_id       = data.terraform_remote_state.portal_core.outputs.app_service_plans["linux"].id
  sql_server_fqdn           = data.terraform_remote_state.portal_core.outputs.sql_server.fqdn
  servicebus_namespace_fqdn = data.terraform_remote_state.portal_core.outputs.servicebus_namespace.fqdn
}

resource "azurerm_linux_web_app" "web" {
  name                = "app-portal-web-prd-uks-01"
  resource_group_name = local.workload_rg.name
  location            = local.workload_rg.location
  service_plan_id     = local.app_service_plan_id
  # ...
}
```

## Special conventions

- **Why portal-core and not platform-hosting?** `portal-core` is portal-family-specific — its App Service Plans, SQL Server, and Service Bus are sized and configured for portal workloads. `platform-hosting` is org-wide. New portal-* repos consume `portal-core`; non-portal workloads consume `platform-hosting`.
- **Backend coords** are passed in via `var.portal_core_state` from each consuming repo's `tfvars/<env>.tfvars` — they are not hard-coded in this file because they vary per env and per consuming repo's wiring.
- **Plan keys**: pick the appropriate one (`linux`, etc.) for the consuming app's hosting need.
- **SQL access**: the SQL server uses managed identity — consumer apps obtain their own MI via `platform-workloads` and are granted DB-level permissions in the consumer's stack.

## Consuming repos

`portal-web`, `portal-environments`, `portal-repository`, `portal-repository-func`, `portal-server-agent`, `portal-server-events`, `portal-servers-integration`, `portal-sync` — each references `portal_core` remote state for shared infra IDs.

## Cross-references

- `patterns.terraform-remote-state.instructions.md` — remote-state wiring pattern
- `platform.hosting.instructions.md` — org-wide ASPs (used by non-portal workloads)
- `platform.monitoring.instructions.md` — central Log Analytics that App Insights publishes to

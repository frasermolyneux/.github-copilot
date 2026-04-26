---
description: Consumption contract for platform-monitoring — central Log Analytics workspace and severity-based action groups.
applyTo: '**/*.tf,**/*.tfvars'
---
# platform-monitoring — Consumer Contract

Provisions a shared **Log Analytics workspace**, severity-based **action groups** (P0–P4), and a **Key Vault** for alert contacts. Consumers attach diagnostics and alert rules to the workspace and route alerts to the action groups.

## What it provides

- Log Analytics Workspace (central, shared, 30-day retention)
- Azure Monitor Action Groups — five severity tiers: `critical`, `high`, `moderate`, `low`, `informational`
- Azure Key Vault with seeded alert contact secrets
- Subscription-level Resource Health and Service Health alert rules (via `terraform-sub/`)

## Terraform outputs

| Output | Shape |
|---|---|
| `log_analytics` | `object({ name, id, resource_group_name, location, workspace_id })` |
| `monitor_action_groups` | `map(object({ id, name, resource_group_name, subscription_id }))` keyed by severity |
| `subscriptions` | list of subscriptions (convenience pass-through from platform-workloads) |

## State backend

| Env | Resource Group | Storage Account |
|---|---|---|
| dev | `rg-tf-platform-monitoring-dev-uksouth-01` | `sa9d99036f14d5` |
| prd | `rg-tf-platform-monitoring-prd-uksouth-01` | `sa74f04c5f984e` |

Container `tfstate`, key `terraform.tfstate`, subscription `7760848c-794d-4a19-8cb2-52f71a21ac2b`.

## Consumer wiring

```hcl
data "terraform_remote_state" "platform_monitoring" {
  backend = "azurerm"
  config = {
    resource_group_name  = var.platform_monitoring_state.resource_group_name
    storage_account_name = var.platform_monitoring_state.storage_account_name
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
    use_oidc             = true
    subscription_id      = var.platform_monitoring_state.subscription_id
    tenant_id            = var.platform_monitoring_state.tenant_id
  }
}

locals {
  log_analytics_id = data.terraform_remote_state.platform_monitoring.outputs.log_analytics.id
  critical_ag_id   = data.terraform_remote_state.platform_monitoring.outputs.monitor_action_groups.critical.id
}

resource "azurerm_monitor_diagnostic_setting" "app_logs" {
  target_resource_id         = azurerm_linux_web_app.app.id
  log_analytics_workspace_id = local.log_analytics_id
  enabled_log { category_group = "allLogs" }
  metric { category = "AllMetrics" }
}

resource "azurerm_monitor_metric_alert" "app_errors" {
  name                = "high-error-rate"
  resource_group_name = azurerm_resource_group.app.name
  scopes              = [azurerm_linux_web_app.app.id]
  severity            = 2
  action {
    action_group_id = local.critical_ag_id
  }
  # ...
}
```

## Required permissions

- **`Storage Blob Data Reader`** on the platform-monitoring state storage (granted by `platform-workloads` when the workload JSON sets `requires_terraform_state_access` for `platform-monitoring`).
- **`Monitoring Contributor`** (or `Log Analytics Contributor`) on the workspace scope to attach diagnostic settings.

## Special conventions

- The central workspace is **not** recycled — dev environment persists for stable state reads.
- Action groups are keyed by severity: `critical`, `high`, `moderate`, `low`, `informational`. Pick the lowest severity that reflects the alert's actual impact.
- Use Azure Monitor severity values (0=Critical, 1=Error, 2=Warning, 3=Informational, 4=Verbose) when defining `severity = N` on alert rules.
- Alert contact details are stored in the seeded Key Vault — update via `platform-monitoring/docs/manual-steps.md` rather than in code.

## Documentation

- `platform-monitoring/docs/consuming-platform-monitoring.md` — full consumption walkthrough with role assignments and example alert rules
- `platform-monitoring/docs/manual-steps.md` — Key Vault secret seeding for alert contacts

## Cross-references

- `patterns.terraform-remote-state.instructions.md` — remote-state wiring pattern
- `platform.workloads.instructions.md` — `requires_terraform_state_access` for granting state read
- `shared.observability-appinsights.instructions.md` — App Insights wiring on the .NET side that pairs with this workspace

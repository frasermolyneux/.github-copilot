---
description: Pattern for consuming upstream Terraform stacks via terraform_remote_state.
applyTo: '**/*.tf'
---
# Pattern — Terraform Remote State

Cross-stack dependencies in the org go via `terraform_remote_state`. Stacks expose narrow, stable outputs; consumers reference state by storage account / container / key, with backend configuration injected as variables.

## Backend block

Backend coordinates of the upstream stack are passed as a structured variable, **not** hard-coded inline:

```hcl
variable "platform_workloads_state" {
  type = object({
    resource_group_name  = string
    storage_account_name = string
    container_name       = string
    key                  = string
    subscription_id      = string
    tenant_id            = string
  })
}

data "terraform_remote_state" "platform_workloads" {
  backend = "azurerm"
  config = {
    resource_group_name  = var.platform_workloads_state.resource_group_name
    storage_account_name = var.platform_workloads_state.storage_account_name
    container_name       = var.platform_workloads_state.container_name
    key                  = var.platform_workloads_state.key
    use_oidc             = true
    subscription_id      = var.platform_workloads_state.subscription_id
    tenant_id            = var.platform_workloads_state.tenant_id
  }
}
```

Per-environment values live in `terraform/tfvars/<env>.tfvars`:

```hcl
platform_workloads_state = {
  resource_group_name  = "rg-tf-platform-workloads-prd-uksouth-01"
  storage_account_name = "sadz9ita659lj9xb3"
  container_name       = "tfstate"
  key                  = "terraform.tfstate"
  subscription_id      = "<state-storage-subscription-id>"
  tenant_id            = "<tenant-id>"
}
```

`use_oidc = true` is mandatory — no storage-account keys (see `standards.oidc-and-secrets`).

## Consumption

Wrap remote-state lookups in `locals` so the rest of the stack references named locals, not nested `data.terraform_remote_state.X.outputs.Y.Z` chains:

```hcl
locals {
  workload_rg = data.terraform_remote_state.platform_workloads
    .outputs.workload_resource_groups[var.workload_name][var.environment]
    .resource_groups[lower(var.location)]

  log_analytics_id = data.terraform_remote_state.platform_monitoring
    .outputs.log_analytics.id
}
```

Use `try(...)` when an output may not exist for every `(workload, environment)` combination:

```hcl
locals {
  workload_au = try(
    data.terraform_remote_state.platform_workloads.outputs
      .workload_administrative_units[var.workload_name][var.environment],
    null
  )
}
```

## Required permissions

Consumers need **`Storage Blob Data Reader`** on the upstream state storage account. This is granted automatically by `platform-workloads` when the workload's JSON sets `requires_terraform_state_access` for the relevant upstream (see `platform.workloads.instructions.md`).

## Common upstream graph

```
platform-landing-zones        (mgmt groups, no Terraform outputs)
  └── platform-workloads      (resource groups, AAD apps, GH/ADO wiring)
        ├── platform-connectivity   (DNS, hub VNet)
        ├── platform-hosting        (App Service plans)
        ├── platform-monitoring     (Log Analytics, action groups)
        ├── platform-registry       (ACR, Bicep modules)
        └── platform-notifications  (notification API)
              └── workload repos    (apps, functions, portal-* services)
```

Each `platform-*` consumption contract is documented in its own `platform.<name>.instructions.md` file.

## Conventions

- Always lowercase locations when indexing nested output maps (`["uksouth"]` not `["UKSouth"]`).
- Always use lowercase environment tags (`dev`, `prd`) — never display names like `Production`.
- Output shapes are owned by the upstream repo; do not reach into the upstream state to compute outputs the upstream did not expose — raise a change to the upstream instead.

---
description: Consumption contract for platform-workloads — workload identities, GitHub/ADO wiring, resource groups, state storage.
applyTo: '**/*.tf,**/*.tfvars,**/workloads/*.json'
---
# platform-workloads — Consumer Contract

Central orchestration stack that transforms **JSON workload definitions** into Azure AD apps, federated identities, GitHub repos with secrets/environments, optional ADO service connections, resource groups, optional Terraform state storage, and per-workload RBAC.

## What it provides per workload, per environment

- AAD application + service principal (`workload_service_principals`)
- Federated credentials (GitHub branch/environment/PR + ADO service connection)
- GitHub environment + secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- Resource groups per location (`workload_resource_groups`)
- Optional: Terraform backend storage (`workload_terraform_backends`)
- Optional: Administrative Unit (`workload_administrative_units`)
- Optional: Deploy-script user-assigned managed identity
- Optional: ADO project + service connection + variable group
- RBAC role assignments — default `Reader` on workload subscription, plus extras from JSON

## Terraform outputs

Outputs are deeply nested — typically indexed by `[workload_name][environment_tag]`:

| Output | Shape |
|---|---|
| `workload_resource_groups[w][env]` | `object({ resource_groups = map(object({ id, name, tags })) })` keyed by location |
| `workload_terraform_backends[w][env]` | backend metadata `{ storage_account_name, container_name, key, ... }` (when `configure_for_terraform = true`) |
| `workload_administrative_units[w][env]` | `object({ object_id, name })` (when AU configured) |
| `workload_service_principals[w][env]` | `object({ client_id, object_id, display_name })` |
| `subscriptions` | master list `{ name = subscription_id, ... }` |

## State backend

| Env | Resource Group | Storage Account |
|---|---|---|
| prd-only | `rg-tf-platform-workloads-prd-uksouth-01` | `sadz9ita659lj9xb3` |

Container `tfstate`, key `terraform.tfstate`, subscription `7760848c-794d-4a19-8cb2-52f71a21ac2b`.

> **Note:** `platform-workloads` runs in prd only — it provisions both dev and prd workload identities from a single state.

## Consumer wiring

```hcl
variable "environment"   { type = string }   # dev | tst | prd (lowercase)
variable "workload_name" { type = string }   # matches JSON name
variable "locations"     { type = list(string) }

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

locals {
  workload_rgs = {
    for location in var.locations :
    location => data.terraform_remote_state.platform_workloads.outputs
      .workload_resource_groups[var.workload_name][var.environment]
      .resource_groups[lower(location)]
  }

  workload_au = try(
    data.terraform_remote_state.platform_workloads.outputs
      .workload_administrative_units[var.workload_name][var.environment],
    null
  )
}
```

## Workload JSON

Workload definitions live in `platform-workloads/terraform/workloads/<category>/<name>.json`. Schema essentials:

- **`name`** — short workload name (matches `{project}` in resource naming)
- **`environments[]`** — per-environment toggles:
  - `connect_to_github` — creates GitHub environment + OIDC federation
  - `configure_for_terraform` — provisions state storage
  - `add_deploy_script_identity` — creates a user-assigned MI for deploy scripts
  - `connect_to_devops` — creates ADO service connection + variable group
  - `requires_terraform_state_access` — list of upstream platform-* state storages this workload reads
- **`role_assignments[]`** — extra RBAC beyond default `Reader`
- **`locations[]`** — Azure regions for the resource groups

The authoritative schema is in `platform-workloads/docs/workload-configuration.md`.

## Federated subject formats

| Caller scope | Subject |
|---|---|
| GitHub Actions branch | `repo:frasermolyneux/<repo>:ref:refs/heads/main` |
| GitHub Actions environment | `repo:frasermolyneux/<repo>:environment:<env-name>` |
| GitHub Actions PR | `repo:frasermolyneux/<repo>:pull_request` |
| Azure DevOps service connection | `asc:<org>:<project>:<scope-path>` |

## Special conventions

- **Index outputs by lowercase environment tag** (`["dev"]`, `["prd"]`), not display name.
- **Lowercase locations** when indexing nested location maps.
- **Resource group naming**: `rg-{workload_name}-{env}-{location}` (auto-generated unless overridden in JSON).
- Consumers do **not** create AAD apps, federated credentials, repo secrets, or resource groups — these are provisioned here.
- To grant a workload remote-state read access to an upstream, add the upstream to `requires_terraform_state_access` in the workload JSON; do not assign `Storage Blob Data Reader` directly in the consumer's stack.

## Documentation

- `platform-workloads/docs/workload-configuration.md` — JSON schema with all properties
- `platform-workloads/docs/consuming-platform-workloads-outputs.md` — consumption patterns for resource groups, backends, AUs
- `platform-workloads/docs/architecture.md` — end-to-end design
- `platform-workloads/docs/role-assignments.md` — RBAC behaviours and ABAC delegation
- `platform-workloads/docs/developer-guide.md` — local commands and targeting tips

## Cross-references

- `patterns.workload-identity-provisioning.instructions.md` — end-to-end flow
- `tenant.identity.instructions.md` — federated subject formats
- `standards.oidc-and-secrets.instructions.md` — no-secrets rule

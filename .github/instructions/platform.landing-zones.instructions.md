---
description: Consumption contract for platform-landing-zones — management group hierarchy and subscription placement.
applyTo: '**/*.tf,**/*.tfvars'
---
# platform-landing-zones — Consumer Contract

Establishes the Azure landing-zone hierarchy: management groups, subscription placement, and break-glass Owner role assignments. The **inception stack** — must be applied before any other platform repo.

## What it provides

- Management group hierarchy (top-level groups: `alz`, `alz-platform`, `alz-landing-zones`, `alz-sandbox`, `alz-decommissioned`, `alz-identity`)
- Subscription-to-management-group associations
- Break-glass Owner role assignments across all subscriptions

## Terraform outputs

**None.** The stack is inception-only — its effects are implicit in the Azure hierarchy. Consumers reference management groups by their stable names (e.g. `alz-platform`, `alz-platform-connectivity`).

## State backend

| Field | Value |
|---|---|
| Subscription | `7760848c-794d-4a19-8cb2-52f71a21ac2b` (management) |
| Resource Group | `rg-tf-platform-landing-zones-prd-uksouth` |
| Storage Account | `satflz1qth54j9fd` |
| Container | `tfstate` |
| Key | `terraform.tfstate` |

## Consumer wiring

There is **no `terraform_remote_state` block** for this stack — there are no outputs to consume. Consumers assume the hierarchy is in place and reference management groups by name when needed:

```hcl
data "azurerm_management_group" "platform" {
  name = "alz-platform"
}
```

## Special conventions

- **Run order** — must apply first; all other platform stacks depend on subscriptions being in the correct management group.
- The management-group prefix defaults to `alz` and is configurable via `var.management_group_prefix` (changing it requires coordinated updates everywhere).
- The break-glass user (from `var.breakglass_principal_id`) gets Owner on all subscriptions; rotate credentials regularly.

## Documentation

- `platform-landing-zones/docs/bootstrap.md` — one-time setup (state storage, deployment identity, GitHub configuration).

## Cross-references

- `tenant.subscriptions.instructions.md` — environment / subscription model
- `patterns.terraform-remote-state.instructions.md` — remote-state pattern (not used here, but applies to downstream platform repos)

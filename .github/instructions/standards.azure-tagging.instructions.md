---
description: Mandatory Azure resource tagging convention for the frasermolyneux organization.
applyTo: '**/*.tf,**/*.bicep'
---
# Standard — Azure Resource Tagging

Every Azure resource provisioned via Terraform must carry the canonical org tag schema.

## Rule

Every taggable resource sets `tags = var.tags` (or `tags = merge(var.tags, { extra = "value" })` when resource-specific tags are needed):

```hcl
resource "azurerm_storage_account" "example" {
  # ...
  tags = var.tags
}
```

The `var.tags` variable is declared in the consumer's `terraform/variables.tf` with the canonical schema and populated from `terraform/tfvars/<env>.tfvars`.

## Canonical schema

```hcl
variable "tags" {
  type = map(string)
  default = {
    Workload    = "<workload-name>"
    Environment = "<dev|prd>"
    Owner       = "<owner-email-or-team>"
    Source      = "https://github.com/frasermolyneux/<repo>"
  }
}
```

Required keys:

| Key | Value |
|---|---|
| `Workload` | Short workload/project name (matches `{project}` in resource naming) |
| `Environment` | Environment role: `dev`, `prd`, etc. |
| `Owner` | Email or team identifier |
| `Source` | Full GitHub URL of the repo that provisioned the resource |

Additional keys are permitted when they add discoverability or cost-attribution value (e.g. `CostCenter`, `Compliance`). Avoid one-off ad-hoc keys.

## Resources without `tags` support

A small number of Azure resource types do not accept a `tags` argument (e.g. some sub-resources, role assignments). These are exempt by definition; do not work around the limitation.

## Compliance

A Terraform stack is tagging-compliant when every taggable resource sets `tags = var.tags` (or a merge thereof) and the `var.tags` definition includes all required keys. Resources missing the assignment are non-compliant.

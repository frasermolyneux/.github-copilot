---
description: Terraform style and configuration conventions for the frasermolyneux organization.
applyTo: '**/*.tf,**/*.tfvars'
---
# Standard — Terraform Style

## Formatting

- Run `terraform fmt -recursive` before every commit. CI enforces this; PRs failing format checks block merge.
- Prefer 2-space indentation as Terraform's default.

## Provider versions

Pin provider versions in `terraform/providers.tf` (or `versions.tf`) using pessimistic constraints (`~>`):

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    azapi = {
      source  = "Azure/azapi"
      version = "~> 2.0"
    }
    azuredevops = {
      source  = "microsoft/azuredevops"
      version = "~> 1.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}
```

The `azurerm` provider is at `~> 4.x` org-wide. Only declare providers actually used.

## Backend configuration

State lives in Azure Storage with **per-environment backend files**:

```
terraform/
├── backends/
│   ├── dev.backend.hcl
│   └── prd.backend.hcl
├── tfvars/
│   ├── dev.tfvars
│   └── prd.tfvars
├── main.tf
├── outputs.tf
├── variables.tf
└── providers.tf
```

Initialise with `terraform -chdir=terraform init -backend-config=backends/<env>.backend.hcl` and plan with `-var-file=tfvars/<env>.tfvars`. Never commit a backend block with hardcoded values inside `.tf` files — the backend block stays empty and is filled at `init` time.

## File layout

Standard files at the root of `terraform/`:

| File | Purpose |
|---|---|
| `main.tf` | Resource declarations (split into `<area>.tf` files when large) |
| `providers.tf` (or `versions.tf`) | `terraform { ... }` block + provider configs |
| `variables.tf` | Input variable declarations |
| `outputs.tf` | Output declarations |
| `locals.tf` | Computed locals (when needed) |
| `data.tf` | Data sources, including `terraform_remote_state` (when many) |

## Variables

- Every variable has a `description`.
- Use a `type` constraint always (`string`, `number`, `bool`, `map(string)`, `list(object({...}))` etc.).
- Provide a sensible `default` only when one truly exists; otherwise leave undefined and require the consumer to set it.

## Modules

Inline modules in `terraform/modules/<name>/` are fine for repo-internal reuse. Cross-repo module sharing happens via `platform-*` repo remote-state outputs, not via published Terraform modules.

## Compliance

- `terraform fmt -recursive -check` returns 0
- `terraform validate` passes for all environments
- Every variable has `type` and `description`
- No hardcoded backend values inside `.tf` files
- Provider versions pinned with `~>` constraints

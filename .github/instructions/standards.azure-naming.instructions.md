---
description: Mandatory Azure resource naming convention for the frasermolyneux organization.
applyTo: '**/*.tf,**/*.tfvars,**/*.bicep'
---
# Standard — Azure Resource Naming

All Azure resources provisioned across the organization follow a single naming convention.

## Format

```
{resource}-{project}-{environment}-{location}-{instance}
```

| Slot | Description | Example |
|---|---|---|
| `{resource}` | Short, lowercased resource-type abbreviation (e.g. `rg`, `app`, `func`, `kv`, `stor`, `sql`, `apim`, `appi`, `log`, `vnet`, `snet`, `pe`, `acr`, `cog`) | `app` |
| `{project}` | Workload / project short name | `portal-web` |
| `{environment}` | Environment role: `dev`, `prd` (and `tst`, `stg` if introduced) | `prd` |
| `{location}` | Region abbreviation: `swc` (swedencentral), `uks` (uksouth), `ukw` (ukwest) | `swc` |
| `{instance}` | Two-digit instance counter, defaulting `01` | `01` |

**Example**: `app-portal-web-prd-uks-01`, `kv-portal-core-dev-uks-01`, `rg-platform-monitoring-prd-uks-01`.

## Globally-unique resource names

Resource types with a globally-unique DNS namespace (storage accounts, Key Vaults, ACRs, Cognitive Services accounts, App Insights workspaces with global URLs) collide on the standard format. For these, append a deterministic random suffix:

```hcl
resource "random_id" "environment_id" {
  byte_length = 4
}

resource "azurerm_storage_account" "example" {
  name = lower(replace("stor${var.project}${var.environment}${var.location_short}${random_id.environment_id.hex}", "-", ""))
  # ...
}
```

The `random_id.environment_id.hex` suffix is the canonical pattern (do not invent ad-hoc randomness elsewhere).

## Resource-type abbreviations

The authoritative abbreviation table is owned by `platform-landing-zones`. Common entries:

| Type | Abbrev |
|---|---|
| Resource Group | `rg` |
| App Service | `app` |
| App Service Plan | `asp` |
| Function App | `func` |
| Key Vault | `kv` |
| Storage Account | `stor` |
| SQL Server | `sql` |
| SQL Database | `sqldb` |
| API Management | `apim` |
| Application Insights | `appi` |
| Log Analytics Workspace | `log` |
| Container Registry | `acr` |
| VNet / Subnet | `vnet` / `snet` |
| Private Endpoint | `pe` |
| Cognitive Services | `cog` |
| Action Group | `ag` |

If a new type is introduced, add an abbreviation to `platform-landing-zones` first, then use it here.

## Compliance

A Terraform stack is naming-compliant when every `name = "..."` attribute (or `name = local.<...>` referring to a local that follows the format) matches the convention. Hard-coded names that diverge are non-compliant unless documented as a deliberate exception in the consumer repo's `docs/` folder.

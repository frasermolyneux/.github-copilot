---
description: Consumption contract for platform-connectivity — DNS zones (public and private) and DNS resource group.
applyTo: '**/*.tf,**/*.tfvars'
---
# platform-connectivity — Consumer Contract

Provisions a DNS resource group per environment and manages public DNS zones for platform domains. In production, also creates private-link DNS zones for common Azure private endpoints.

## What it provides

- Azure DNS resource group (per environment)
- Public DNS zones (e.g. `molyneux.io`, `molyneux.me`, `molyneux.dev`, `xtremeidiots.com`, `geo-location.net`)
- Private DNS zones for Azure private endpoints (**prd only**)
- DNS records (A, AAAA, CNAME, MX, TXT, SRV) — JSON-driven config

## Terraform outputs

| Output | Shape |
|---|---|
| `dns_resource_group_name` | string |
| `dns_zones` | `map(object({ id, name, name_servers, dns_provider }))` keyed by zone name |

The `dns_provider` field indicates whether the zone is Azure-managed or Cloudflare-managed.

## State backend

| Env | Resource Group | Storage Account |
|---|---|---|
| dev | `rg-tf-platform-connectivity-dev-uksouth-01` | `sac353e6f165d5` |
| prd | `rg-tf-platform-connectivity-prd-uksouth-01` | `sa98ad99056d00` |

Container `tfstate`, key `terraform.tfstate`, subscription `7760848c-794d-4a19-8cb2-52f71a21ac2b`.

## Consumer wiring

```hcl
data "terraform_remote_state" "platform_connectivity" {
  backend = "azurerm"
  config = {
    resource_group_name  = var.platform_connectivity_state.resource_group_name
    storage_account_name = var.platform_connectivity_state.storage_account_name
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
    use_oidc             = true
    subscription_id      = var.platform_connectivity_state.subscription_id
    tenant_id            = var.platform_connectivity_state.tenant_id
  }
}

locals {
  dns_zones = data.terraform_remote_state.platform_connectivity.outputs.dns_zones
}

resource "azurerm_dns_cname_record" "app" {
  name                = "myapp"
  zone_name           = local.dns_zones["molyneux.io"].name
  resource_group_name = data.terraform_remote_state.platform_connectivity.outputs.dns_resource_group_name
  ttl                 = 300
  record              = azurerm_app_service.app.default_hostname
}
```

## Special conventions

- **Zones are JSON-driven** — defined in `platform-connectivity/terraform/zones/*.json`. To add or modify a zone, edit the JSON and PR to `platform-connectivity`.
- **Private DNS zones only deploy in prd** — dev has the resource group only, no private zones.
- Consumers that need new DNS records should commit JSON updates to `platform-connectivity` rather than provisioning the records in their own stack (record ownership stays with the connectivity stack for zone-level visibility).
- Cloudflare-managed zones are referenced through `dns_zones` for metadata, but record changes happen in Cloudflare, not Azure — check the `dns_provider` field.

## Documentation

- `platform-connectivity/docs/architecture-overview.md` — zone structure and private-endpoint naming
- `platform-connectivity/docs/development-workflows.md` — branch strategy, JSON edit flow

## Cross-references

- `tenant.dns.instructions.md` — DNS policy and certificate sourcing
- `tenant.network-topology.instructions.md` — hub VNet linking for private DNS
- `patterns.terraform-remote-state.instructions.md` — remote-state wiring pattern

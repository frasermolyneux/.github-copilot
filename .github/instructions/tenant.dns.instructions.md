---
description: DNS zones owned by the frasermolyneux tenant — public and private, naming, certificate sourcing.
applyTo: '**'
---
# Tenant — DNS

DNS zones (public and private) are owned and provisioned by `platform-connectivity` (see `platform.connectivity.instructions.md`). Consumers reference zones via remote-state outputs — they do **not** create new zones in workload repos.

## Public zones

The tenant owns one or more public DNS zones used for workload front-doors, custom domains, and cert validation. Records (CNAME, A, TXT) for a workload's custom domain are added to the appropriate zone by the consumer's Terraform via `azurerm_dns_*_record`, referencing the zone resource group from `platform-connectivity` remote state.

## Private zones

Private DNS zones for Azure private-endpoint resolution (e.g. `privatelink.blob.core.windows.net`, `privatelink.azurewebsites.net`, `privatelink.database.windows.net`) live in the hub and are linked to the hub VNet by `platform-connectivity`. When a workload provisions a private endpoint, the consumer must:

- Resolve the matching private DNS zone via remote state
- Register the private endpoint's A record in that zone (typically via `private_dns_zone_group` on the endpoint)

## Certificates

TLS certificates for custom domains are sourced from:

- **App Service Managed Certificates** for App Service-hosted workloads with custom domains (free, auto-renewed).
- **Azure Front Door managed certificates** for AFD-fronted workloads.
- **Key Vault certificates** (rare) where the above don't apply — referenced from Key Vault provisioned by the workload.

Do not commit certificate material to source.

## Adding a new zone

If a workload genuinely requires a new DNS zone (public or private), raise a change to `platform-connectivity` to add it before authoring the consumer.

## Cross-references

- `platform.connectivity.instructions.md` — DNS zone outputs to consume
- `tenant.network-topology.instructions.md` — hub VNet linking

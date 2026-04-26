---
description: Network topology for the frasermolyneux Azure tenant — hub-and-spoke layout, address-space allocation, peering rules.
applyTo: '**'
---
# Tenant — Network Topology

The tenant uses a **hub-and-spoke** topology, with the hub VNet and shared networking primitives provisioned by `platform-connectivity` (see `platform.connectivity.instructions.md` for consumption details).

## Hub responsibilities

The hub VNet hosts:

- Shared private DNS resolution (private endpoints from spokes resolve via hub DNS — see `tenant.dns.instructions.md`)
- Outbound egress controls (where applicable)
- Peering anchor for all spokes

## Spoke pattern

Each workload's Terraform stack provisions its own spoke VNet (when networking is required) and peers it to the hub. The peering relationship is declared on the spoke side using outputs from `platform-connectivity` remote state.

## Address-space allocation

Address ranges are allocated by `platform-landing-zones` / `platform-connectivity`. Consumers must:

- Use only ranges allocated to their workload (do not pick arbitrary CIDRs).
- Reference the allocated range from remote-state output rather than hard-coding.
- Avoid overlapping with the hub or sibling spokes.

If a new workload requires a network range, raise a change to `platform-landing-zones` to allocate one before authoring the consumer's spoke.

## When spokes are not needed

Many workloads (App Service, Functions on consumption plans, SQL with public endpoint disabled via service endpoints) do not require their own spoke VNet. Default to **no spoke** unless one of the following applies:

- VNet integration is mandatory for the chosen SKU
- Private endpoints are required for compliance
- The workload needs to reach on-premises or peered resources

## Cross-references

- `platform.connectivity.instructions.md` — consumption contract (outputs to reference)
- `tenant.dns.instructions.md` — DNS zones and resolution
- `standards.azure-naming.instructions.md` — VNet/subnet naming

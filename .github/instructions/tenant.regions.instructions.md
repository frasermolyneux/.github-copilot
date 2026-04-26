---
description: Approved Azure regions for the frasermolyneux tenant.
applyTo: '**'
---
# Tenant — Approved Azure Regions

## Approved regions

| Region | Abbrev | Role |
|---|---|---|
| `swedencentral` | `swc` | **Default for all dev environments** and **all new workload production environments** (due to ongoing `uksouth` capacity constraints). |
| `uksouth` | `uks` | Existing production region. Continues to host already-deployed prd workloads and platform-* prd state. Do **not** target for new workload prd deployments. |
| `ukwest` | `ukw` | Paired secondary region for geo-redundant resources (paired-region storage, secondary App Service, DR scenarios). |

## Rules for consumers

- **New workloads (any environment)** — set `location = "swedencentral"` in `terraform/tfvars/dev.tfvars` **and** `prd.tfvars`.
- **All `dev` environments (new or existing)** — `location = "swedencentral"`. When migrating an existing dev stack, plan and apply the move at the next maintenance window.
- **Existing prd workloads in `uksouth`** — stay in place. Do not relocate without an explicit migration plan.
- **Platform-* prd state and existing platform infra** — remain in `uksouth` (state-storage RGs and SAs are documented per platform repo). New platform-* dev stacks follow the dev rule (`swedencentral`).
- **Geo-redundancy** — pair `swedencentral` with `swedensouth` (or another supported pair) where the resource type supports paired-region failover; pair `uksouth` with `ukwest` for legacy stacks.
- Region values belong in `terraform/tfvars/<env>.tfvars` as `location = "<region>"`, never hard-coded in module bodies.
- Resource names include the region abbreviation in the `{location}` slot per `standards.azure-naming.instructions.md` (`swc`, `uks`, `ukw`).
- Do not introduce additional regions without updating this file and `platform-landing-zones`.

## Region-restricted services

Some services have limited regional availability (e.g. certain SKUs of API Management, Static Web Apps, AI/Cognitive services). When provisioning such a service:

1. Confirm availability in the target region (`swedencentral` for new workloads, `uksouth` for existing prd).
2. If unavailable, fall back to the nearest approved region that supports the SKU and document the deviation in the consumer repo's `docs/` folder.
3. Re-evaluate at the next major upgrade — capacity/availability changes regularly.

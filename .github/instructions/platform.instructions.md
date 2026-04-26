---
description: Layer-1 catalog of platform-* infrastructure repos and how to find the right consumption contract.
applyTo: '**'
---
# Platform Repos — Catalog

The `platform-*` repositories provide tenant-level **infrastructure** that workload repos consume via Terraform `terraform_remote_state`. Each platform repo has a dedicated `platform.<name>.instructions.md` describing its outputs, backend coordinates, and consumer wiring.

## Repos

| Repo | Provides | Consumption file |
|---|---|---|
| `platform-landing-zones` | Management groups, subscription placement, break-glass RBAC | `platform.landing-zones.instructions.md` |
| `platform-connectivity` | DNS resource group, public DNS zones, private-link DNS (prd) | `platform.connectivity.instructions.md` |
| `platform-hosting` | Shared App Service Plans (map-driven, multi-location) | `platform.hosting.instructions.md` |
| `platform-monitoring` | Central Log Analytics, severity-based action groups, alert KV | `platform.monitoring.instructions.md` |
| `platform-registry` | Shared Azure Container Registry, published Bicep modules | `platform.registry.instructions.md` |
| `platform-workloads` | Workload identities, GH/ADO wiring, resource groups, state storage | `platform.workloads.instructions.md` |
| `platform-notifications` | Centralised email/SMS notification API (APIM-fronted) | `platform.notifications.instructions.md` |

## Consumption pattern

All platform repos follow the same shape:

1. Inputs: backend coordinates of the upstream stack (passed as a structured Terraform variable from `tfvars/<env>.tfvars`).
2. Outputs: a small set of named outputs documented in the per-repo file.
3. Authentication: OIDC via `use_oidc = true` on the remote-state data source. Required role: `Storage Blob Data Reader` on the upstream state storage account, granted automatically by `platform-workloads` when the workload JSON sets `requires_terraform_state_access`.

See `patterns.terraform-remote-state.instructions.md` for the canonical wiring snippet that applies to every platform repo.

## Dependency order

```
platform-landing-zones
  └── platform-workloads
        ├── platform-connectivity
        ├── platform-hosting
        ├── platform-monitoring
        ├── platform-registry
        └── platform-notifications
              └── workload repos
```

`platform-landing-zones` must be applied first; `platform-workloads` second; the remaining platform stacks can run in parallel; workload repos consume any subset of the above.

## Conventions across platform repos

- Lowercase environment tags when indexing nested outputs (`["dev"]`, `["prd"]`, never `["Production"]`).
- Lowercase locations (`["uksouth"]`).
- Outputs are stable contracts — additions are backwards-compatible; removals or renames require coordinated consumer updates.

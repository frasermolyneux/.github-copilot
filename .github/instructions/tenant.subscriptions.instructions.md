---
description: Subscription and management group layout for the frasermolyneux Azure tenant.
applyTo: '**'
---
# Tenant — Subscriptions and Management Groups

The frasermolyneux Azure tenant follows a lightweight landing-zone layout. The authoritative source for subscription IDs, mgmt-group hierarchy, and policy assignments is the `platform-landing-zones` repository (see `platform.landing-zones.instructions.md` for consumption details).

## Environment split

- **Dev / non-prod** subscription — receives all `feature/*`, `bugfix/*`, `hotfix/*` branch deployments and `dev` Terraform stacks. Tolerates short-lived experimental resources.
- **Prd / production** subscription — receives only `main`-branch deployments and `prd` Terraform stacks. Drift-controlled via weekly scheduled deploy-prd runs.

Per-environment Terraform inputs are kept in `terraform/tfvars/<env>.tfvars` and `terraform/backends/<env>.backend.hcl` in every consumer repo.

## Naming aliases

When referring to subscriptions in documentation or commit messages, prefer the role name (`dev`, `prd`) over the GUID. Subscription IDs themselves should not be hard-coded outside of `platform-landing-zones`; consumers obtain them via `terraform_remote_state` or workload-identity-injected variables.

## Management groups

Workloads are grouped under environment-aligned management groups for policy inheritance. Policy assignments (Azure Policy, defender, diagnostic settings) are owned by `platform-landing-zones` and inherited automatically — consumers should **not** redefine policies at the workload subscription scope.

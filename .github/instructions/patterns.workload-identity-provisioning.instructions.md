---
description: End-to-end workload identity provisioning flow via platform-workloads.
applyTo: '**/*.tf,**/workloads/*.json'
---
# Pattern — Workload Identity Provisioning

All non-Azure-internal authentication for a workload (GitHub Actions OIDC, Azure DevOps service connections, deploy scripts) is provisioned by `platform-workloads` from a JSON workload definition. Consumer repos do **not** create AAD apps, federated credentials, or repo secrets directly.

## End-to-end flow

```
JSON definition in platform-workloads/terraform/workloads/<category>/<name>.json
  │
  ├─→ Resource group(s) per environment per location
  ├─→ AAD app + service principal per environment
  ├─→ Federated credentials (GitHub branch / environment / PR + ADO sc)
  ├─→ GitHub repo: environments, secrets (AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID), branch protection
  ├─→ Optional: ADO project + service connection + variable group
  ├─→ Optional: Terraform state storage (rg + sa + container)
  ├─→ Optional: Deploy-script user-assigned managed identity
  ├─→ Optional: Administrative Unit
  └─→ RBAC role assignments (Reader by default; extras via JSON)
```

## JSON schema essentials

A workload JSON declares:

- **`name`** — short workload name, used in resource naming
- **`environments`** — list of environments (`dev`, `tst`, `prd`) with per-environment toggles
- **Per-environment toggles**:
  - `connect_to_github` — creates GitHub environment + OIDC federation
  - `configure_for_terraform` — provisions state storage
  - `add_deploy_script_identity` — creates a user-assigned MI for deploy scripts
  - `connect_to_devops` — creates an ADO service connection + variable group
  - `requires_terraform_state_access` — list of upstream platform-* state storages this workload reads
- **`role_assignments`** — extra RBAC beyond default `Reader` on the workload subscription
- **`locations`** — Azure regions for the resource groups

The authoritative schema is in `platform-workloads/docs/workload-configuration.md`.

## Federated subject formats

`platform-workloads` registers federated credentials with:

| Caller scope | Subject |
|---|---|
| GitHub Actions branch | `repo:frasermolyneux/<repo>:ref:refs/heads/main` |
| GitHub Actions environment | `repo:frasermolyneux/<repo>:environment:<env-name>` |
| GitHub Actions PR | `repo:frasermolyneux/<repo>:pull_request` |
| Azure DevOps service connection | `asc:<org>:<project>:<scope-path>` (per ADO docs) |

## What the consumer repo gets

After `platform-workloads` runs, the consumer repo has:

- GitHub repo secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (per environment)
- GitHub environments matching `environments[*].name`
- Branch protection on `main` (requires status checks)
- (If `configure_for_terraform`) a state storage account whose backend coords can be plugged into the workload's `terraform/backends/<env>.backend.hcl`
- Resource groups already created — the workload's Terraform stack only fills them with resources, never creates them

## What the consumer repo does NOT do

- Does **not** create `azuread_application`, `azuread_service_principal`, or `azuread_application_federated_identity_credential` resources.
- Does **not** create GitHub repo secrets or environments via Terraform.
- Does **not** create ADO service connections.
- Does **not** create its own resource groups (unless explicitly outside the platform-workloads model — rare).

## Adding or changing a workload

1. Author or update the JSON in `platform-workloads/terraform/workloads/<category>/<name>.json`.
2. Open a PR to `platform-workloads`. Dev plan runs automatically; add `run-prd-plan` label for prd plan.
3. Merge to `main` → prd apply provisions/updates the AAD app, GitHub secrets, etc.
4. Consumer repo can then pick up the new identity / RG / state on its next deploy.

## Cross-references

- `platform.workloads.instructions.md` — consumer-side outputs and JSON-schema pointer
- `tenant.identity.instructions.md` — federated subject formats
- `standards.oidc-and-secrets.instructions.md` — no-secrets rule

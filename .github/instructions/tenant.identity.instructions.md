---
description: AAD tenant identity model, group conventions, and federated-credential subject formats specific to the frasermolyneux tenant.
applyTo: '**'
---
# Tenant — Identity

## AAD tenant

A single Microsoft Entra ID (AAD) tenant backs all subscriptions. Workload identities (AAD apps + service principals) are provisioned by `platform-workloads` from JSON definitions; consumers do **not** create AAD apps directly (see `platform.workloads.instructions.md`).

## Identity model preference order

1. **System-assigned managed identity** on the Azure resource itself (preferred for Azure-internal auth).
2. **User-assigned managed identity** when the same identity must be shared across resources.
3. **Workload-identity-federated app registration** (provisioned by `platform-workloads`) for non-Azure callers — GitHub Actions, Azure DevOps, on-prem.
4. **Client secrets** — **prohibited** (see `standards.oidc-and-secrets.instructions.md`).

## Federated-credential subject formats

`platform-workloads` registers federated credentials on AAD apps with subjects following these patterns:

| Caller | Subject format |
|---|---|
| GitHub Actions — branch | `repo:frasermolyneux/<repo>:ref:refs/heads/<branch>` |
| GitHub Actions — environment | `repo:frasermolyneux/<repo>:environment:<env-name>` |
| GitHub Actions — pull request | `repo:frasermolyneux/<repo>:pull_request` |
| Azure DevOps service connection | `sc://<org>/<project>/<service-connection-name>` |

The exact subjects per workload are declared in the workload JSON definition (see `platform.workloads.instructions.md` for schema). Consumers reference the resulting client ID via injected GitHub repo secret / ADO variable group rather than hard-coding.

## Group conventions

Azure RBAC role assignments target either:

- The workload identity directly (one identity → one role on one scope), **or**
- An AAD group whose membership is managed by `platform-workloads`.

Avoid assigning roles to individual users; if a human break-glass identity is needed, document it in the consumer repo's `docs/` folder and time-box it.

## Cross-references

- `platform.workloads.instructions.md` — workload JSON schema and provisioning
- `standards.oidc-and-secrets.instructions.md` — no-client-secrets rule
- `patterns.workload-identity-provisioning.instructions.md` — end-to-end provisioning flow

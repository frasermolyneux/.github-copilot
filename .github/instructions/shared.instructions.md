---
description: Layer-1 catalog of shared library and automation repos and how to find the right consumption contract.
applyTo: '**'
---
# Shared Library / Automation Repos — Catalog

These repositories provide **reusable code and CI/CD building blocks** consumed by other repos in the org. Unlike `platform-*` repos (which provision Azure infrastructure consumed via Terraform remote state), `shared.*` repos provide **NuGet packages**, **GitHub Actions composites**, and **Azure DevOps templates**.

## Repos

| Repo | Provides | Consumption file |
|---|---|---|
| `actions` | GitHub Actions composite catalog (~30 composites) | `shared.actions.instructions.md` |
| `ado-pipeline-templates` | Azure DevOps reusable stages/jobs/tasks | `shared.ado-pipeline-templates.instructions.md` |
| `api-client-abstractions` | `MX.Api.Abstractions` NuGet — base types for typed API clients | `shared.api-client-abstractions.instructions.md` |
| `observability-appinsights` | `MX.Observability.ApplicationInsights*` NuGets — telemetry filtering, audit logger, job telemetry | `shared.observability-appinsights.instructions.md` |
| `invision-api-client` | `MX.InvisionCommunity.Api.Client` NuGet — Invision Community typed API client | `shared.invision-api-client.instructions.md` |
| `portal-core` | Terraform shared infra for `portal-*` repos (App Insights, ASPs, SQL, Service Bus) | `shared.portal-core.instructions.md` |

## Cross-references

- **GitHub Actions version pins** for the `actions/` composites are the canonical source of truth in `workflows.frasermolyneux-actions.instructions.md`. `shared.actions.instructions.md` describes the conceptual contract; pinned tags live there.
- The NuGet packages all build on `MX.Api.Abstractions` for their result-envelope shape (`IApiResult<T>`).

## Conventions across shared repos

- All NuGet packages target **net9.0** (and net10.0 where applicable).
- Versioning is **NBGV** (`patterns.nbgv-versioning.instructions.md`).
- Each typed-client NuGet ships a companion `*.Testing` package with in-memory fakes and a DTO factory.
- DI registration is via fluent-options extensions (`AddXxx(opts => opts.WithBaseUrl(...).WithEntraIdAuthentication(...))`).

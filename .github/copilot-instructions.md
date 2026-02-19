# Organization-Wide Copilot Instructions

This workspace contains 30+ repositories for the frasermolyneux GitHub organization. These instructions apply across all projects opened alongside this `.github-copilot` folder.

## Workspace Navigation

When working in this multi-root workspace, always identify the target repository folder first. The prompts and agents in `.github-copilot` operate against other workspace folders — do not mix context between repos.

- **`.github-copilot/`** — Shared Copilot instructions, prompts, and agents (this repo)
- **`.github/`** — Organization engineering estate: pipeline badges, workload catalog, route-to-production visibility
- **`actions/`** — Reusable composite GitHub Actions catalog (.NET CI, Terraform automation, deployment helpers)
- **`platform-*`** — Infrastructure backbone: workload identity provisioning, DNS, hosting, monitoring, registry
- **`portal-*`** — XtremeIdiots gaming portal: web app, APIs, bots, event ingest, data sync
- **Application repos** — Domain services: `geo-location`, `demo-manager`, `talkwithtiles`, `travel-itinerary`, etc.
- **Shared libraries** — `api-client-abstractions`, `invision-api-client` (NuGet packages)

## Tech Stacks

| Layer | Stack |
|-------|-------|
| Cloud | Azure exclusively (App Service, Functions, SQL, APIM, Key Vault, Storage, App Insights) |
| IaC | Terraform with `azurerm` ~> 4.x, `azuread`, `azapi`, `azuredevops`, `github` providers |
| Backend | .NET 9 (ASP.NET Core, Azure Functions), some .NET Framework 4.8 legacy |
| Frontend | Razor Views, SCSS via npm |
| Testing | xUnit + Moq; Playwright for integration tests |
| CI/CD | GitHub Actions using reusable composites from `actions/` repo |
| Versioning | Nerdbank.GitVersioning (NBGV) — `version.json` per project/folder |

## Build and Test Commands

**.NET projects** (check each repo for the specific `.sln` path):
```bash
dotnet build src/<SolutionName>.sln
dotnet test src/<SolutionName>.sln
dotnet test src/<SolutionName>.sln --filter "FullyQualifiedName!~IntegrationTests"  # skip slow integration tests
dotnet test src/<SolutionName>.sln --filter "FullyQualifiedName~MyTestClass.MyTestMethod"  # single test
```

**Terraform projects**:
```bash
terraform -chdir=terraform init -backend-config=backends/dev.backend.hcl
terraform -chdir=terraform plan -var-file=tfvars/dev.tfvars
terraform fmt -recursive  # always run before committing
```

**SCSS (portal-web)**:
```bash
cd src/XtremeIdiots.Portal.Web && npm install && npm run build:css
npm run watch:css  # live editing
```

## Architecture Patterns

- **API Client Pattern**: Typed HTTP clients with abstractions for testability. Consumer repos reference NuGet packages containing `I*ApiClient` interfaces, generated clients, and `*Testing` packages with in-memory fakes and DTO factories.
- **Repository Pattern**: Data access through repository interfaces (e.g., Table Storage, MaxMind) with DI registration and cache-first flows.
- **Versioned APIs**: Namespace-based controllers (`Controllers.V1`, `Controllers.V1_1`) with APIM segment versioning. OpenAPI specs served at runtime, imported into APIM via `az apim api import` in deploy workflows.
- **Remote State Dependencies**: Terraform stacks reference upstream state via `terraform_remote_state` data sources (e.g., `platform-workloads` → `portal-core` → `portal-web`).
- **Workload Identity**: `platform-workloads` auto-provisions Azure AD apps, service principals with OIDC federation, GitHub repo secrets, and Azure DevOps service connections from JSON definitions.

## Key Conventions

- **OIDC everywhere** — No client secrets. GitHub Actions and Azure DevOps authenticate via OIDC federated credentials.
- **Resource naming**: `{resource}-{project}-{environment}-{location}-{instance}`. Globally unique resources append `random_id.environment_id.hex`.
- **Tagging**: Always set `tags = var.tags` on every Terraform resource.
- **Environment configs**: `terraform/tfvars/dev.tfvars` and `terraform/backends/dev.backend.hcl` per environment.
- **Branch strategy**: `feature/*`, `bugfix/*`, `hotfix/*` → dev deploys; `main` → production deploys.
- **PR verification**: Dev Terraform plans run automatically on PRs. Prd plans require the `run-prd-plan` label. Dependabot/Copilot PRs skip Terraform plans unless explicitly labeled.
- **Nullable reference types**: All .NET projects use `<Nullable>enable</Nullable>` with implicit usings.
- **Test filtering**: CI excludes integration tests via `--filter "FullyQualifiedName!~IntegrationTests"`.
- **Managed identities over secrets**: Always prefer managed identities for Azure resource access.

## Reusable Actions (`actions/` repo)

Workflows across all repos consume shared composites:
- `frasermolyneux/actions/dotnet-ci` — Restore, build, test, package .NET solutions
- `frasermolyneux/actions/dotnet-web-ci` — Web app build with publish output
- `frasermolyneux/actions/dotnet-func-ci` — Azure Functions build
- `frasermolyneux/actions/terraform-plan` — Init, validate, plan with OIDC and PR commenting
- `frasermolyneux/actions/terraform-apply` — Download plan artifact and apply
- `frasermolyneux/actions/deploy-app-service` / `deploy-function-app` / `deploy-sql-database` — Azure deployment helpers
- `frasermolyneux/actions/nbgv-metadata` — Export Nerdbank.GitVersioning build versions

## Prompts and Agents

Use the prompts and agents defined in this repo (`.github-copilot/.github/prompts/` and `.github-copilot/.github/agents/`) for standardized updates:
- **`@workspace /update-project-metadata`** — Updates README, CONTRIBUTING, SECURITY, and copilot-instructions for a target repo
- **`@workspace /align-project-workflows`** — Aligns GitHub Actions workflows, Dependabot config, and related files to org standards

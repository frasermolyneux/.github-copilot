# Organization-Wide Copilot Instructions

This workspace contains 30+ repositories for the frasermolyneux GitHub organization. These instructions apply across all projects opened alongside this `.github-copilot` folder.

## ⚠️ Read first — Personal Working Preferences

Fraser's personal rules for working with Copilot are in `.github/instructions/personal.working-preferences.instructions.md` (always-on, `applyTo: '**'`). Headlines:

- **Don't** run `git commit`, `git push`, `merge`, `rebase`, `reset --hard`, or branch create/delete on your own initiative — only when Fraser explicitly asks.
- **Default to working on `main`.** Do not create feature branches or PRs unless Fraser asks.
- **Run the `code-review` sub-agent** before declaring non-trivial work "done".

These preferences override conflicting defaults. Read the full file for the complete rules.

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

Prefer running VS Code tasks when available in the target repository (`.vscode/tasks.json`), especially for build and format checks. If tasks are not available, use the fallback commands below.

**.NET projects** (check each repo for the specific `.sln` path):
```bash
dotnet build src/<SolutionName>.sln
dotnet format src/<SolutionName>.sln --verify-no-changes
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

Each pattern below has a dedicated `patterns.*.instructions.md` file with full detail and applyTo scoping:

- **Typed API client** — `patterns.api-client.instructions.md`
- **Repository pattern** — `patterns.repository.instructions.md`
- **Versioned APIs** — `patterns.versioned-apis.instructions.md`
- **Terraform remote state** — `patterns.terraform-remote-state.instructions.md`
- **Workload identity provisioning** — `patterns.workload-identity-provisioning.instructions.md`
- **NBGV versioning** — `patterns.nbgv-versioning.instructions.md`
- **SCSS build** — `patterns.scss-build.instructions.md`

## Platform Settings Contracts (Portal Repos)

For portal settings work (`portal-web`, `portal-server-events`, `portal-servers-integration`, `portal-server-agent`, `portal-repository`):

- Canonical typed contracts are in `XtremeIdiots.Portal.Settings.Contracts.V1` (owner: `portal-repository`).
- Repository persistence remains dynamic (`Namespace` + JSON string). Do not introduce typed settings transport DTO endpoints.
- Do not reintroduce raw namespace/property JSON parsing in runtime controller/provider/resolver paths for migrated namespaces.
- Treat `XtremeIdiots.Portal.ChatCommands.Abstractions.V1` as compatibility-only during migration; do not use it as canonical source for new settings behavior.
- Remove compatibility shims only when the implementation-plan gate criteria are fully evidenced across all section 6.2 consumers.

## Key Conventions

Each standard below has a dedicated `standards.*.instructions.md` file with full detail and compliance checks:

- **Azure naming** — `standards.azure-naming.instructions.md`
- **Azure tagging** — `standards.azure-tagging.instructions.md`
- **OIDC and no-secrets** — `standards.oidc-and-secrets.instructions.md`
- **Terraform style** — `standards.terraform-style.instructions.md`
- **.NET project files** — `standards.dotnet-project.instructions.md`
- **Branching and PRs** — `standards.branching-and-prs.instructions.md`
- **Health endpoints and probes** — `standards.health-endpoints.instructions.md`
- **Workflow scheduling** — `workflows.scheduling.instructions.md` (centralised ops-clock; deploy-prd weekly drift prevention; Dependabot Sunday, codequality Monday, deploy-prd Wed/Thu/Fri)
- **Test filtering**: CI excludes integration tests via `--filter "FullyQualifiedName!~IntegrationTests"`.

## Reusable Actions (`actions/` repo)

Quick reference of headline composites — full contract for each is in `shared.actions.instructions.md`; **pinned tag versions** are in `workflows.frasermolyneux-actions.instructions.md`:

- `frasermolyneux/actions/dotnet-ci` — Restore, build, test, package .NET solutions
- `frasermolyneux/actions/dotnet-web-ci` / `dotnet-func-ci` — Web/Function app builds with publish output
- `frasermolyneux/actions/terraform-plan` / `terraform-apply` — IaC with OIDC and PR commenting
- `frasermolyneux/actions/deploy-app-service` / `deploy-function-app` / `deploy-sql-database` — Azure deployment helpers
- `frasermolyneux/actions/apim-api-import` / `wait-for-version` — APIM import paired with version verification
- `frasermolyneux/actions/publish-nuget-packages` — NuGet/symbol push (NUGET_API_KEY via `env:`, not `with:`)
- `frasermolyneux/actions/nbgv-metadata` — Export Nerdbank.GitVersioning build versions

## Prompts and Agents

Use the prompts and agents defined in this repo (`.github-copilot/.github/prompts/` and `.github-copilot/.github/agents/`) for standardized updates:
- **`@workspace /update-project-metadata`** — Updates README, CONTRIBUTING, SECURITY, copilot-instructions, and AGENTS for a target repo
- **`@workspace /update-agents`** — Updates a target repo `AGENTS.md` using the canonical template and enforces the .NET build+format sign-off gate where applicable
- **`@workspace /align-project-workflows`** — Aligns GitHub Actions workflows, Dependabot config, and related files to org standards
- **`@workspace /audit-project-workflows`** — Read-only drift report for all workflows in a target repo
- **`@workspace /create-workflow`** — Bootstraps a single new canonical workflow in a target repo
- **`@workspace /audit-project-alignment`** — Read-only drift report against tenant/standards/patterns/platform/shared contracts
- **`code-review` sub-agent** (`.github-copilot/.github/agents/code-review.agent.md`) — Read-only review of in-progress changes before declaring non-trivial work done. Required by `personal.working-preferences.instructions.md`; invoked via `runSubagent` with `agentName: code-review`.

## Workflow Instructions Hierarchy

Workflow standards are encoded in `.github-copilot/.github/instructions/` as three layers (more specific layers override less specific):

1. **Universal** (`applyTo: '.github/workflows/**/*.yml'`)
   - `workflows.instructions.md` — permissions, runners, action pins, OIDC, concurrency, YAML style, triggers
   - `workflows.scheduling.instructions.md` — ops-clock cron rules and skip-dev-on-schedule pattern (also applies to `dependabot.yml`)
2. **Category** (group of workflows or by content type)
   - `workflows.frasermolyneux-actions.instructions.md` — composite-action catalog and pinned tags (single source of truth)
   - `workflows.terraform.instructions.md` — Terraform conventions
   - `workflows.dotnet.instructions.md` — .NET conventions
   - `workflows.security.instructions.md` — Sonar / scanning / dependency-review
3. **Per-workflow** (one per canonical workflow filename)
   - `workflows.build-and-test.instructions.md`, `workflows.pr-verify.instructions.md`, `workflows.codequality.instructions.md`, `workflows.copilot-setup-steps.instructions.md`, `workflows.dependabot-automerge.instructions.md`, `workflows.dependabot-config.instructions.md`, `workflows.deploy-dev.instructions.md`, `workflows.deploy-prd.instructions.md`, `workflows.destroy-environment.instructions.md`, `workflows.destroy-development.instructions.md`, `workflows.release-version-and-tag.instructions.md`, `workflows.release-publish-nuget.instructions.md`

Each per-workflow file contains the canonical YAML template plus a compliance checklist. The matching `update-*-workflow.prompt.md` is a thin shim that delegates to it.

Bespoke single-repo workflows (`actions-versioning.yml`, `code-quality.yml`, `devops-secure-scanning.yml`, `estate-sync.yml`, `feature-development.yml`, `decommission-state-rm.yml`, `update-dashboard-from-staging.yml`) have no per-workflow file; they still inherit the universal and category layers.

## Metadata Instructions Hierarchy

Project metadata standards (README, CONTRIBUTING, SECURITY, repo-level Copilot instructions, agent brief, code-owners, and GitHub PR/issue templates) are encoded in `.github-copilot/.github/instructions/` as two layers (more specific layers override less specific):

1. **Universal** (`applyTo: '{README,CONTRIBUTING,SECURITY}.md,.github/copilot-instructions.md'`)
   - `metadata.instructions.md` — workspace targeting, editing principles, personal-project framing, `docs/` folder requirement, pointer to canonical text blocks
2. **Per-file** (one per metadata file)
   - `metadata.readme.instructions.md` — structure (badges, Documentation, Overview, verbatim Contributing/Security)
   - `metadata.contributing.instructions.md` — canonical verbatim content
   - `metadata.security.instructions.md` — canonical verbatim content
   - `metadata.copilot-instructions.instructions.md` — generation guidelines for the target repo's `.github/copilot-instructions.md`
   - `metadata.agents.instructions.md` — generation guidelines for the per-repo `AGENTS.md` (cloud coding-agent brief)
   - `metadata.codeowners.instructions.md` — canonical content rules for `.github/CODEOWNERS`
   - `metadata.pull-request-template.instructions.md` — canonical content rules for `.github/PULL_REQUEST_TEMPLATE.md` (org-default in `.github` repo + per-repo override)
   - `metadata.issue-templates.instructions.md` — canonical content rules for `.github/ISSUE_TEMPLATE/` (org-default in `.github` repo + per-repo override; includes the `delegate-to-agent` form)

Each per-file file is the source of truth. The matching `update-*.prompt.md` is a thin shim that delegates to it. The `update-project-metadata.agent.md` agent orchestrates `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/copilot-instructions.md`, and `AGENTS.md`; `CODEOWNERS` and PR/issue templates are currently rolled out manually or via per-repo prompts.

Canonical reusable content for the four new metadata files lives in `.github-copilot/templates/`: `AGENTS.md`, `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/{config,delegate-to-agent,bug_report,feature_request}.yml`. The org-wide `frasermolyneux/.github` repo holds the deployed PR template + issue templates — every repo inherits those automatically. `AGENTS.md` and `CODEOWNERS` must be present **per repo** (no org-level inheritance).

## Tenant, Standards, Patterns, Platform, Shared Hierarchy

Five further instruction prefixes encode org-wide context that applies beyond a single file type:

| Prefix | Purpose | applyTo strategy |
|---|---|---|
| `tenant.*` | **Facts** about the Azure tenant (subscriptions, regions, network, identity, DNS) | `'**'` — always-on |
| `standards.*` | **Binary, enforceable rules** (naming, tagging, OIDC, Terraform style, .NET project, branching) | File-type scoped |
| `patterns.*` | **Reusable approaches** (API client, repository, versioned APIs, remote state, workload identity, NBGV, SCSS) | File-type scoped |
| `platform.*` | **Consumption contracts** for `platform-*` infra repos | `'**'` — always-on |
| `shared.*` | **Consumption contracts** for shared library/automation repos (`actions/`, NuGets, ADO templates, `portal-core`) | `'**'` — always-on |

**`tenant.*` files** (5):
- `tenant.subscriptions.instructions.md`, `tenant.regions.instructions.md`, `tenant.network-topology.instructions.md`, `tenant.identity.instructions.md`, `tenant.dns.instructions.md`

**`standards.*` files** (7):
- `standards.azure-naming.instructions.md`, `standards.azure-tagging.instructions.md`, `standards.oidc-and-secrets.instructions.md`, `standards.terraform-style.instructions.md`, `standards.dotnet-project.instructions.md`, `standards.branching-and-prs.instructions.md`, `standards.health-endpoints.instructions.md`

**`patterns.*` files** (7):
- `patterns.api-client.instructions.md`, `patterns.repository.instructions.md`, `patterns.versioned-apis.instructions.md`, `patterns.terraform-remote-state.instructions.md`, `patterns.workload-identity-provisioning.instructions.md`, `patterns.nbgv-versioning.instructions.md`, `patterns.scss-build.instructions.md`

**`platform.*` files** (8 — Layer-1 catalog plus 7 per-repo):
- `platform.instructions.md` (catalog), `platform.landing-zones.instructions.md`, `platform.connectivity.instructions.md`, `platform.hosting.instructions.md`, `platform.monitoring.instructions.md`, `platform.registry.instructions.md`, `platform.workloads.instructions.md`, `platform.notifications.instructions.md`

**`shared.*` files** (7 — Layer-1 catalog plus 6 per-repo):
- `shared.instructions.md` (catalog), `shared.actions.instructions.md`, `shared.ado-pipeline-templates.instructions.md`, `shared.api-client-abstractions.instructions.md`, `shared.observability-appinsights.instructions.md`, `shared.invision-api-client.instructions.md`, `shared.portal-core.instructions.md`

**Companion agent**: `audit-project-alignment.agent.md` produces a read-only drift report for a target repo against these layers.


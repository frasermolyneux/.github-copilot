# AGENTS.md — <repo-name>

<!-- One line: what this repo is + tech stack. Example:
"ASP.NET Core 9 web front-end for the XtremeIdiots Portal. Razor + SCSS, Application Insights, deployed to Azure App Service via GitHub Actions." -->

This file is the brief for the **GitHub Copilot coding agent** (and any other agent that follows the [agents.md](https://agents.md) convention) when it runs in a cloud runner without the local VS Code multi-root workspace context.

> If you are a human reading this in VS Code, prefer `.github/copilot-instructions.md` for project orientation. `AGENTS.md` is the agent execution brief.

---

## Required reading (read these BEFORE doing any work)

The `copilot-setup-steps.yml` workflow checks out `frasermolyneux/.github-copilot` at `./.github-copilot/` in the runner, so the paths below resolve.

1. `.github/copilot-instructions.md` — repo-specific orientation, build commands, conventions
2. `.github-copilot/.github/instructions/personal.working-preferences.instructions.md` — Fraser's always-on rules: git hands-off, default to assigned branch, run `code-review` agent before reporting done
3. `.github-copilot/.github/copilot-instructions.md` — org-wide context catalog (use as index for the layered instruction files below)
4. Stack-specific files — see **Stack guardrails** below

---

## Stack guardrails

<!-- List only the layers this repo consumes. Discover via:
  - terraform_remote_state blocks in terraform/*.tf → which platform-* contracts apply
  - <PackageReference Include="MX.*" /> in *.csproj → which shared NuGets apply
  - frasermolyneux/actions/ references in .github/workflows/*.yml → which composites apply -->

### Tenant facts (always-on)
- `.github-copilot/.github/instructions/tenant.subscriptions.instructions.md`
- `.github-copilot/.github/instructions/tenant.regions.instructions.md`
- `.github-copilot/.github/instructions/tenant.identity.instructions.md`
- `.github-copilot/.github/instructions/tenant.dns.instructions.md`
- `.github-copilot/.github/instructions/tenant.network-topology.instructions.md`

### Enforceable standards (apply to your changes)
- `.github-copilot/.github/instructions/standards.oidc-and-secrets.instructions.md` — **no client secrets, ever**
- `.github-copilot/.github/instructions/standards.branching-and-prs.instructions.md`
<!-- Terraform repos add: -->
- `.github-copilot/.github/instructions/standards.azure-naming.instructions.md`
- `.github-copilot/.github/instructions/standards.azure-tagging.instructions.md`
- `.github-copilot/.github/instructions/standards.terraform-style.instructions.md`
<!-- .NET repos add: -->
- `.github-copilot/.github/instructions/standards.dotnet-project.instructions.md`

### Patterns (apply where relevant)
<!-- Pick only the ones used by this repo. Examples:
- patterns.terraform-remote-state.instructions.md
- patterns.api-client.instructions.md
- patterns.repository.instructions.md
- patterns.versioned-apis.instructions.md
- patterns.nbgv-versioning.instructions.md
- patterns.scss-build.instructions.md -->

### Platform consumption contracts (only those this repo consumes)
<!-- e.g.:
- platform.workloads.instructions.md
- platform.monitoring.instructions.md
- platform.connectivity.instructions.md -->

### Shared library / automation contracts (only those this repo consumes)
<!-- e.g.:
- shared.api-client-abstractions.instructions.md
- shared.observability-appinsights.instructions.md
- shared.actions.instructions.md -->

---

## Build, test, format

<!-- Concrete commands. Examples below — adapt per repo. -->

```pwsh
# Build
dotnet build src/<Solution>.sln

# Tests (excluding integration tests, matching CI)
dotnet test src/<Solution>.sln --filter "FullyQualifiedName!~IntegrationTests"

# Single test
dotnet test src/<Solution>.sln --filter "FullyQualifiedName~MyTestClass.MyTestMethod"

# Format check
dotnet format src/<Solution>.sln --verify-no-changes
```

<!-- Terraform repos: -->

```pwsh
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform init -backend-config=backends/dev.backend.hcl
terraform -chdir=terraform validate
terraform -chdir=terraform plan -var-file=tfvars/dev.tfvars
```

---

## Do NOT

- ❌ Do not `git commit`, `git push`, force-push, rebase, `reset --hard`, or create/delete branches. Work on the branch you were assigned to.
- ❌ Do not introduce client secrets, connection strings, or hard-coded subscription IDs / GUIDs. Auth is OIDC + managed identity only — see `standards.oidc-and-secrets.instructions.md`.
- ❌ Do not bypass `terraform fmt`, `dotnet format`, test runs, or other validation gates.
- ❌ Do not change resource naming/tagging conventions — they are enforced (`standards.azure-naming.instructions.md`, `standards.azure-tagging.instructions.md`).
- ❌ Do not pull context from sibling workspace folders. Only what is inside this repo and `./.github-copilot/` is in scope.
- ❌ Do not assume tools/SDKs are installed beyond what `.github/workflows/copilot-setup-steps.yml` provisions. If you need more, add the step and explain why.
- ❌ Do not modify `.github/workflows/`, `.github/dependabot.yml`, `version.json`, `Directory.Build.props`, or any `platform-*` consumption wiring unless that is the explicit task.

<!-- Repo-specific "do nots" go here. Examples:
- portal-repository-func: Do not add FTP/RCON/Service Bus/GeoLocation dependencies — wrong repo.
- portal-server-agent: Do not add Service Bus consumer logic — that belongs in portal-server-events. -->

---

## Validation before opening PR

Confirm each item in the PR body using the org-wide template (`.github/PULL_REQUEST_TEMPLATE.md`, inherited from `frasermolyneux/.github`).

- [ ] Build succeeds locally / in CI
- [ ] Tests pass (excluding integration tests where applicable)
- [ ] Format check passes (`terraform fmt -check` / `dotnet format --verify-no-changes`)
- [ ] No new secrets / GUIDs / connection strings introduced
- [ ] Changes align with files in **Stack guardrails**
- [ ] PR body cites each acceptance criterion from the originating issue
- [ ] Risk/rollout section filled in (especially for infra changes)

---

## Escalation

If you hit any of the conditions below, **open the PR as draft** and **apply the `needs-decision` label** instead of pushing forward to ready-for-review. Post a comment on the originating issue summarising what's blocking you and what decision is needed.

This protects against the agent silently expanding scope, bypassing a contract change, or merging a half-resolved review finding.

Stop and escalate when:

- Required reading file is missing or conflicting.
- The change would require touching `.github/workflows/`, `version.json`, or `platform-*` wiring outside the stated scope.
- A `code-review` finding is High severity and you cannot resolve it without expanding scope.
- A required tool/SDK is unavailable in the runner and `copilot-setup-steps.yml` would need significant modification.
- The acceptance criteria are ambiguous or contradict the linked instruction files.

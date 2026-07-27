# Phase 0 · Part 1 — Repo Provisioning & Scaffolding

Provision the new `dotnet-caching` repo and scaffold it to org standards. **No package logic yet** — Part 1 ends with an empty, CI-green skeleton whose projects produce `.nupkg`s. Part 2 implements the packages.

> Prerequisite reading: the [Phase 0 README](README.md) (decisions, golden rules) and [spec.md → MX.Caching facade](../portal-caching-spec/spec.md#mxcaching-facade-over-hybridcache).

## 1.0 — Provision the repo via `platform-workloads`

Repos in this org are created from JSON workload definitions, **not** by hand.

- **Do:** Add `terraform/workloads/dev-platform/dotnet-caching.json` in `platform-workloads`, modelled on `dev-platform/api-client-abstractions.json`:
  - `name`: `dotnet-caching`
  - `github.description`: e.g. *"MX.Caching: shared .NET 9/10 caching facade over HybridCache with a Table Storage backend and config-driven provider selection, published to NuGet."*
  - `github.topics`: `dotnet`, `caching`, `hybridcache`, `azure-table-storage`, `nuget`, `github-actions`
  - `github.add_sonarcloud_secrets: true`
  - `github.add_nuget_environment: true`
  - `github.visibility: public`
  - `github.rulesets`: copy the `main-protection` ruleset **verbatim** from `api-client-abstractions.json` (required status checks `build-and-test`, `quality / Code Quality`, `devops-secure-scanning / DevOps Secure Scanning`, `SonarCloud Code Analysis`, `dependabot-policy`; CodeQL + SonarCloud code scanning; linear history; PR thread resolution; Copilot review on).
  - **No** `configure_for_terraform` / Azure infra — this is a NuGet-only library repo.
- **Acceptance:** PR opened against `platform-workloads`; `terraform plan` shows the new repo (+ OIDC identity + NuGet environment) and nothing unexpected.
- **Gate:** Merge the `platform-workloads` PR **before** any package work. The repo must exist first. This is the package/infra prerequisite — surface it early.

## 1.A — Scaffold the repo to org standards

Mirror `api-client-abstractions` / `observability-opentelemetry`.

- **Do — build files:**
  - `Directory.Build.props` and `Directory.Packages.props` (central package management), copied/adapted from `api-client-abstractions`.
  - `version.json` (NBGV) at repo root, `"version": "0.1"`.
  - `.editorconfig` per `standards.editorconfig` (nullable enabled, file-scoped namespaces, C# latest).
- **Do — solution & empty projects** under `src/MX.Caching.sln`, each multi-TFM `net9.0;net10.0`, `GeneratePackageOnBuild=true`, `PackageReadmeFile=README.md`:
  - `MX.Caching.Abstractions`
  - `MX.Caching` (references `Microsoft.Extensions.Caching.Hybrid`, `MX.Caching.Abstractions`)
  - `MX.Caching.TableStorage` (references `Azure.Data.Tables`, `MX.Caching.Abstractions`)
  - `MX.Caching.Testing`
  - `MX.Caching.Tests` (xUnit + Moq) — not packed.
  - Each package project gets a placeholder `README.md`.
- **Do — metadata** (use `update-project-metadata`): `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/copilot-instructions.md`, `AGENTS.md`, `.github/CODEOWNERS`, PR/issue templates.
- **Do — workflows** (use `align-project-workflows`): `build-and-test.yml`, `pr-verify.yml`, `codequality.yml`, `copilot-setup-steps.yml`, `dependabot-automerge.yml`, `release-version-and-tag.yml`, `release-publish-nuget.yml`, `.github/dependabot.yml`. **NuGet library repo** — no terraform, no `deploy-*`; release flow mirrors `api-client-abstractions`.
- **Do — VS Code tasks** (use `align-vscode-dotnet-tasks`): `.vscode/tasks.json` with `dotnet: build` / `dotnet: test` / `dotnet: format`.
- **Acceptance:** Solution builds; each package emits a `.nupkg` on build; `pr-verify` + `codequality` + `devops-secure-scanning` green on the scaffolding PR.
- **Validate:**
  ```pwsh
  dotnet build src/MX.Caching.sln
  dotnet test src/MX.Caching.sln --filter "FullyQualifiedName!~IntegrationTests"
  dotnet format src/MX.Caching.sln --verify-no-changes
  ```

## Part 1 exit gate

- `dotnet-caching` repo provisioned with protection ruleset + NuGet environment.
- Empty skeleton builds, tests (none yet) and format pass, CI green, `.nupkg`s produced.
- No caching logic implemented yet.

Proceed to [part-2-packages.md](part-2-packages.md).

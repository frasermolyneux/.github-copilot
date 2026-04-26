---
description: Consumption contract for ado-pipeline-templates — reusable Azure DevOps stages, jobs, and tasks.
applyTo: '**/azure-pipelines*.yml,**/.azuredevops/**/*.yml'
---
# ado-pipeline-templates — Consumer Contract

Reusable Azure DevOps templates organised as `stages/`, `jobs/`, and `tasks/`. Consumed by ADO pipelines (`azure-pipelines*.yml`) in workload repos that use ADO instead of (or alongside) GitHub Actions.

## Resource declaration

Pipelines reference the repo as a `repository` resource and then `template:` into the desired template:

```yaml
resources:
  repositories:
    - repository: ado-pipeline-templates
      type: github
      name: frasermolyneux/ado-pipeline-templates
      endpoint: frasermolyneux

stages:
  - template: stages/build-function-app.yml@ado-pipeline-templates
    parameters:
      projectName: MyFunction
      workingDirectory: src/Functions
```

## Stage templates (`stages/`)

| Template | Purpose | Key parameters |
|---|---|---|
| `build-function-app.yml` | Build a function app, archive as zip, publish artefact `drop` | `projectName`, `workingDirectory` |
| `validate-terraform-environment.yml` | Terraform `init`/`validate`/`plan` for a given env | backend config, env service connection, var file |
| `deploy-terraform-environment.yml` | Terraform `init`/`validate`/`plan`/`apply`; emits `terraform output` as pipeline variables | backend config, var file, env service connection |

## Job templates (`jobs/`)

| Template | Purpose | Key parameters |
|---|---|---|
| `build-net-core-projects.yml` | Restore/build/test .NET solution; optional CodeQL + dependency scanning | `jobName`, `dependsOn`, `publishArtifact`, `projectName`, `majorMinorVersion`, `nugetConfigPath`, `codeQlEnabled` |
| `build-net-library.yml` | Restore/build/pack a single library to NuGet | `jobName`, `dependsOn`, `publishArtifact`, `projectName`, `majorMinorVersion`, `nugetConfigPath`, `codeQlEnabled` |
| `build-function-app.yml` | Restore/build a function app; optional CodeQL + zip artefact | `jobName`, `dependsOn`, `publishArtifact`, `projectName` |
| `build-web-app.yml` | Restore/build a web app; optional CodeQL + zip artefact | `jobName`, `dependsOn`, `publishArtifact`, `projectName` |
| `build-sql-database.yml` | Build `database.sqlproj`; optional `database` artefact publish | `jobName`, `dependsOn`, `publishArtifact` |
| `dependency-check.yml` | OWASP Dependency-Check; publishes JUnit results | `jobName`, `dependsOn`, `failOnCVSS`, `suppressionFile` |
| `deploy-function-app.yml` | Deploy packaged function app; supports blue/green slot swap | `jobName`, `dependsOn`, `artifactName`, `environmentName`, `retryCount` |
| `deploy-web-app.yml` | Deploy packaged web app; supports blue/green slot swap | `jobName`, `dependsOn`, `artifactName`, `environmentName`, `retryCount` |
| `deploy-sql-database.yml` | Deploy `.dacpac` via service-principal auth | `jobName`, `dependsOn`, `artifactName`, `environmentName`, `sqlCmdArgs` |
| `devops-secure-scanning.yml` | PSRule + Microsoft Security DevOps; publishes SARIF | `jobName`, `dependsOn`, `tools`, `breakOnFindingType` (`error`/`warning`/`note`) |
| `push-nuget-package.yml` | Push a single NuGet to NuGet.org | `jobName`, `dependsOn`, `artifactName`, `packageVersion` (requires `nuget-token` variable) |
| `push-nuget-packages.yml` | Push all `.nupkg` files from an artefact | `jobName`, `dependsOn`, `artifactName` (requires `nuget-token` variable) |

## Task templates (`tasks/`)

| Template | Purpose |
|---|---|
| `terraform-plan-and-apply.yml` | Step template using Azure CLI with OIDC; captures `terraform output` as pipeline variables + JSON artefact |

## Conventions

- **Service-connection pattern**: every Azure-touching template takes an `environmentServiceConnection` parameter — pass the federated ADO service connection name provisioned by `platform-workloads`.
- **Variable groups**: NuGet push templates require a `nuget-token` variable from a variable group; identity-related variables come from the variable group provisioned by `platform-workloads` (when the workload JSON sets `connect_to_devops`).
- **Versioning**: pipelines that build NuGet packages combine `majorMinorVersion` (parameter) with the ADO `BuildId` to produce the package version. Where NBGV is desirable, use `nbgv` CLI in a script step instead.

## Cross-references

- `platform.workloads.instructions.md` — ADO project, service connection, variable group provisioning
- `standards.oidc-and-secrets.instructions.md` — federated service-connection authentication
- `shared.actions.instructions.md` — equivalent GitHub Actions composites for non-ADO repos

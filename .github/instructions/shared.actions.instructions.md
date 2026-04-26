---
description: Consumption contract for the actions repo — composite GitHub Actions catalog (conceptual). Pinned versions are in workflows.frasermolyneux-actions.instructions.md.
applyTo: '.github/workflows/**/*.yml'
---
# actions/ — Consumer Contract

The `actions/` repo hosts ~30 reusable **composite GitHub Actions** consumed across every repo's `.github/workflows/*.yml`. This file describes each composite's **purpose, inputs, outputs, and consumer wiring**.

> **Pinned tag versions** are the responsibility of `workflows.frasermolyneux-actions.instructions.md` — that file is the single source of truth for what tag to use. Always cross-reference it when adding a `uses:` block.

## Catalog

### .NET CI

#### `dotnet-ci`
- **Purpose**: Build, test, and (optionally) upload NuGet packages for a .NET solution.
- **Key inputs**: `dotnet-version` (default `9.0.x`), `src-folder` (default `src`), `perform-checkout`, `skip-nuget-artifact-upload`, `dotnet-workloads`.
- **Outputs**: `build_version` (NBGV NuGet version), `semver`.
- **Sample**:
  ```yaml
  - uses: frasermolyneux/actions/dotnet-ci@dotnet-ci/v1.4
    with:
      dotnet-version: "9.0.x"
      src-folder: src
  ```

#### `dotnet-web-ci`, `dotnet-func-ci`
Variants that produce web-app / function-app publish artifacts.

#### `dotnet-sdk-setup`
Installs one or more .NET SDK versions (supports preview channels). Outputs `stable-versions`, `preview-versions`.

#### `dotnet-playwright-tests`
Runs Playwright integration tests against a deployed app.

#### `nbgv-metadata`
- **Purpose**: Resolve NBGV version metadata for any subsequent step.
- **Outputs**: `build_version`, `semver`, `assembly_version`, `file_version`, `public_release`.

### Terraform

#### `terraform-plan`
- **Purpose**: `init`, `validate`, `plan` against an environment with Azure OIDC; uploads plan artefact and posts results to PR.
- **Key inputs**: `terraform-folder` (default `terraform`), `terraform-var-file`, `terraform-backend-file`, `AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID`.
- **Sample**:
  ```yaml
  - uses: frasermolyneux/actions/terraform-plan@terraform-plan/v1.4
    with:
      terraform-folder: terraform
      terraform-var-file: tfvars/dev.tfvars
      terraform-backend-file: backends/dev.backend.hcl
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ```

#### `terraform-apply`
- **Purpose**: Download a `terraform-plan` artefact and apply it.
- **Sample**: same `AZURE_*` inputs; consumes the plan artefact uploaded by `terraform-plan`.

#### `terraform-plan-and-apply`
Single-step plan + apply (no separation), used in workflows where reviewing the plan separately is not required.

#### `terraform-plan-readonly`, `terraform-output`, `terraform-state-check`, `terraform-state-rm`, `terraform-import`, `terraform-destroy`, `terraform-destroy-resources`, `terraform-pr-comment`
Variants and helpers for non-standard Terraform operations.

### Deployment

#### `deploy-app-service`
- **Purpose**: Deploy a packaged web artefact to Azure App Service. Includes SCM endpoint health check before deploy and 3× retry on 503.
- **Key inputs**: `web-artifact-name`, `web-app-name`, `resource-group-name`, `AZURE_*`.

#### `deploy-function-app`
Same shape, for Azure Functions. Supports staging-slot deployment + swap.

#### `deploy-sql-database`
Deploys a `.dacpac` to Azure SQL. Inputs include connection details and the SQL artifact name.

#### `deploy-logic-app`
Deploys Logic App definitions.

### APIM

#### `apim-api-import`
- **Purpose**: Import an OpenAPI spec into APIM under an API Version Set; waits for the deployed app to report the expected version first (via `wait-for-version`).
- **Key inputs**: `api-id`, `api-display-name`, `api-path`, `api-version`, `api-version-set-id`, `specification-url`, `service-url`, `info-url`, `expected-version`, `apim-name`, `apim-resource-group`, `product-id`, `AZURE_*`.

#### `wait-for-version`
- **Purpose**: Poll a `/info` endpoint until `buildVersion` matches `expected-version`.
- **Inputs**: `info-url`, `expected-version`, `max-attempts` (default `30`), `delay-seconds` (default `10`).

### NuGet

#### `publish-nuget-packages`
- **Purpose**: Push `.nupkg` and `.snupkg` files from an artefact to NuGet.org.
- **Key inputs**: `artifact-name`; optional `artifact-run-id` + `github-token` for cross-workflow downloads.
- **Required env**: `NUGET_API_KEY` (passed via `env:`, **not** `with:`).
- **Sample**:
  ```yaml
  - uses: frasermolyneux/actions/publish-nuget-packages@publish-nuget-packages/v2.0
    with:
      artifact-name: nuget-packages
    env:
      NUGET_API_KEY: ${{ secrets.NUGET_API_KEY }}
  ```

### Utility

#### `detect-changes`
- **Purpose**: Detect file changes via git diff and emit per-filter boolean outputs. Forces all true on `schedule` / `workflow_dispatch` events.
- **Key inputs**: `filters` — newline-separated `name:glob` pairs.
- **Outputs**: `force_all`, plus one boolean output per filter name.
- **Sample**:
  ```yaml
  - uses: frasermolyneux/actions/detect-changes@detect-changes/v1.0
    id: changes
    with:
      filters: |
        src:src/**
        terraform:terraform/**
  - if: steps.changes.outputs.src == 'true'
    run: dotnet build
  ```

### Logic Apps & Bicep

#### `logic-app-ci`
Build pipeline for Logic Apps Standard projects.

#### `bicep-lint-code`
Bicep lint and security scanning.

### Test orchestration

#### `run-api-integration-tests`
Runs `.NET` integration test suites against a deployed environment.

## Tag pinning rules

- Always pin to the specific tag listed in `workflows.frasermolyneux-actions.instructions.md` (e.g. `@dotnet-ci/v1.4`, `@terraform-plan/v1.4`). Never use `@main` or floating refs. Sample tags in this file are illustrative — the **canonical pinned versions live in `workflows.frasermolyneux-actions.instructions.md`**.
- Do **not** use `@main` outside of the `actions/` repo's own internal CI.
- See `workflows.frasermolyneux-actions.instructions.md` for the canonical pinned-tag list.

## Authoring new composites

When adding a composite to the `actions/` repo:

1. Each composite is a top-level folder with `action.yml` and a `version.json` (NBGV).
2. `pathFilters` in `version.json` scopes git height to the composite's folder.
3. CI publishes tags `<name>/v{X.Y.Z}`, `<name>/v{X.Y}`, `<name>/v{X}` on push to `main`.
4. Add the composite to `workflows.frasermolyneux-actions.instructions.md` so consumers can discover it with a pin.

## Cross-references

- `workflows.frasermolyneux-actions.instructions.md` — pinned-tag catalog (the source of truth for `@version`)
- `patterns.nbgv-versioning.instructions.md` — versioning model used per composite
- `standards.oidc-and-secrets.instructions.md` — `AZURE_*` inputs are OIDC-backed federated identities

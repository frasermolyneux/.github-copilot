---
description: Canonical pattern for the Deploy Dev workflow — manual deployment to the Development environment. Layered on top of workflows.terraform.instructions.md, workflows.dotnet.instructions.md, and workflows.frasermolyneux-actions.instructions.md.
applyTo: '**/deploy-dev.yml'
---

# `deploy-dev.yml` Pattern

Manual workflow that deploys application + infrastructure to `Development`. Triggered only by `workflow_dispatch`. Used both for ad-hoc dev deploys and as a starting point for the more complex `deploy-prd` flow.

## Applicability

Repos with deployable components targeting a `Development` GitHub environment. Pure-infrastructure repos may also have this if they want a manual dev rebuild (otherwise PR auto-plan + merge is enough).

## Trigger

```yaml
name: Deploy Dev

on:
  workflow_dispatch:

permissions: {}
```

No `push:` trigger here — pushing to `main` triggers `deploy-prd.yml`, which handles the dev → prd promotion.

## Job composition

Combine jobs based on project content. The general dependency chain is:

```
build-and-test ── terraform-plan-and-apply-dev ── <app/func/sql>-deploy-dev
```

Add a `terraform output` step to the Terraform job to expose the resource names downstream.

### Terraform-only repos

```yaml
terraform-plan-and-apply-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  steps:
    - uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### .NET web app + Terraform + App Service deploy

```yaml
build-and-test:
  permissions:
    contents: read
    id-token: write
  runs-on: ubuntu-latest
  steps:
    - uses: frasermolyneux/actions/dotnet-web-ci@dotnet-web-ci/v1.4
      with:
        dotnet-project: "<MyOrg.MyApp.Web>"
        dotnet-version: 9.0.x
        src-folder: "src"

terraform-plan-and-apply-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  needs: build-and-test
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  outputs:
    web_app_name: ${{ steps.terraform-output.outputs.web_app_name }}
    web_app_resource_group: ${{ steps.terraform-output.outputs.web_app_resource_group }}
  steps:
    - uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

    - id: terraform-output
      shell: bash
      run: |
        cd terraform
        echo "web_app_name=$(terraform output -raw web_app_name)" >> $GITHUB_OUTPUT
        echo "web_app_resource_group=$(terraform output -raw web_app_resource_group)" >> $GITHUB_OUTPUT
      env:
        ARM_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        ARM_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
        ARM_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        ARM_USE_AZUREAD: true
        ARM_USE_OIDC: true

app-service-deploy-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  needs:
    - build-and-test
    - terraform-plan-and-apply-dev
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  steps:
    - uses: frasermolyneux/actions/deploy-app-service@deploy-app-service/v1.2
      with:
        web-artifact-name: "<MyOrg.MyApp.Web>"
        web-app-name: ${{ needs.terraform-plan-and-apply-dev.outputs.web_app_name }}
        resource-group-name: ${{ needs.terraform-plan-and-apply-dev.outputs.web_app_resource_group }}
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### .NET Functions + Terraform + multiple Function Apps

The Terraform job exposes a JSON list `func_apps` (each `{name, resource_group_name}`); the deploy job uses a matrix:

```yaml
build-and-test:
  permissions:
    contents: read
    id-token: write
  runs-on: ubuntu-latest
  steps:
    - uses: frasermolyneux/actions/dotnet-func-ci@dotnet-func-ci/v1.4
      with:
        dotnet-project: "<MyOrg.MyApp.Functions>"
        dotnet-version: 9.0.x
        src-folder: "src"

terraform-plan-and-apply-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  needs: build-and-test
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  outputs:
    func_apps: ${{ steps.terraform-output.outputs.func_apps }}
  steps:
    - uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

    - id: terraform-output
      shell: bash
      run: |
        cd terraform
        echo "func_apps=$(terraform output -json func_apps)" >> $GITHUB_OUTPUT
      env:
        ARM_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        ARM_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
        ARM_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        ARM_USE_AZUREAD: true
        ARM_USE_OIDC: true

function-app-deploy-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  needs:
    - build-and-test
    - terraform-plan-and-apply-dev
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  strategy:
    matrix:
      func_app: ${{ fromJSON(needs.terraform-plan-and-apply-dev.outputs.func_apps) }}
  steps:
    - uses: frasermolyneux/actions/deploy-function-app@deploy-function-app/v1.2
      with:
        function-app-artifact-name: "<MyOrg.MyApp.Functions>"
        function-app-name: ${{ matrix.func_app.name }}
        function-app-resource-group: ${{ matrix.func_app.resource_group_name }}
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### Static Web App

Three jobs: `build-and-test` (Node build + artefact upload), `terraform-plan-and-apply-dev` (with a follow-up step exposing `static_web_app_name` via `terraform output`), and `static-web-app-deploy-dev` (download artefact, fetch SWA API key, deploy).

```yaml
build-and-test:
  permissions:
    contents: read
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with:
        node-version: 20.x
    - name: Install dependencies
      run: npm install
      working-directory: src
    - name: Build static site
      run: npm run build
      working-directory: src
    - name: Remove node_modules before packaging
      run: rm -rf node_modules
      working-directory: src
    - name: Upload site artifact
      uses: actions/upload-artifact@v7
      with:
        name: static-site
        path: src

terraform-plan-and-apply-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  needs: build-and-test
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  steps:
    - uses: frasermolyneux/actions/terraform-plan-and-apply@terraform-plan-and-apply/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

    - id: terraform-output
      shell: bash
      run: |
        cd terraform
        echo "static_web_app_name=$(terraform output -raw static_web_app_name)" >> $GITHUB_OUTPUT
      env:
        ARM_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        ARM_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
        ARM_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        ARM_USE_AZUREAD: true
        ARM_USE_OIDC: true

  outputs:
    static_web_app_name: ${{ steps.terraform-output.outputs.static_web_app_name }}

static-web-app-deploy-dev:
  permissions:
    contents: read
    id-token: write
  environment: Development
  needs: [build-and-test, terraform-plan-and-apply-dev]
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  steps:
    - name: Download site artifact
      uses: actions/download-artifact@v7
      with:
        name: static-site
        path: static-site

    - name: Az CLI Login
      uses: azure/login@v3
      with:
        client-id: ${{ vars.AZURE_CLIENT_ID }}
        subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
        tenant-id: ${{ vars.AZURE_TENANT_ID }}

    - id: static-web-app-api-key
      uses: azure/CLI@v2
      with:
        inlineScript: |
          static_web_app_api_key=$(az staticwebapp secrets list -n ${{ needs.terraform-plan-and-apply-dev.outputs.static_web_app_name }} -o tsv --query properties.apiKey)
          echo "::add-mask::$static_web_app_api_key"
          echo static_web_app_api_key=$static_web_app_api_key >> $GITHUB_ENV

    - id: deploy-static-web-app
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ env.static_web_app_api_key }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: upload
        app_location: static-site
        skip_app_build: true
```

Notes:
- The SWA API key is the only place `secrets.GITHUB_TOKEN` legitimately appears in deploy workflows; Azure identity still flows from `vars.*` via OIDC.
- `::add-mask::` MUST be applied to the API key before it lands in `$GITHUB_ENV`.
- `skip_app_build: true` because the build already happened in `build-and-test`.
- The build step is build-system-agnostic — swap the Node steps above for Ruby/Jekyll (`ruby/setup-ruby@v1` + `bundle exec jekyll build`) or any other static-site generator. The contract is: produce a built site directory and upload it as the `static-site` artefact named `static-site`.

## Deploy ordering rules

- `build-and-test` always runs before `terraform-plan-and-apply-dev` (so Terraform never applies on a broken build).
- App/Function/SQL deploys depend on **both** the build and Terraform jobs.
- Every dev job uses concurrency group `${{ github.repository }}-dev`.

## Compliance checklist

1. Trigger is `workflow_dispatch` only.
2. Top-level `permissions: {}`.
3. Build job present matching project type, with appropriate permissions.
4. Terraform job has `environment: Development` and concurrency `${{ github.repository }}-dev`.
5. Terraform `outputs:` exposed for downstream deploy jobs.
6. Deploy job(s) `needs:` both `build-and-test` and `terraform-plan-and-apply-dev`.
7. Composite versions match `workflows.frasermolyneux-actions.instructions.md`.
8. Azure identity sourced from `vars.*`, never `secrets.*`.
9. `permissions.id-token: write` on every job calling Azure or Terraform composites.

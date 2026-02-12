---
name: update-deploy-prd-workflow
description: Align the repository's Deploy Prd GitHub Actions workflow with the standardized format, ensuring that it includes appropriate build, Terraform plan-and-apply for both Dev and Prd environments, and deployment jobs based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/workflows/deploy-prd.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for the Deploy Prd workflow. If it does exist, update it to match the standardized configuration, adjusting job templates and directories as needed based on the project contents.

## Deploy Prd

All repositories that have deployable components should have a standardized deploy prd workflow `.github/workflows/deploy-prd.yml` for production releases. This workflow promotes through Dev first (on push to main) then to Prd, and also runs on a weekly schedule and manual dispatch. Depending on the project type, use the appropriate combination of build, Terraform, and deployment templates from the `frasermolyneux/actions` GitHub repository.

A repository may contain multiple types of code and deployment targets, in which case combine the relevant templates into a single workflow, ensuring that all are aligned with the standardized practices.

### Key differences from Deploy Dev
- Triggers include `push` to `main`, `workflow_dispatch`, and a weekly `schedule` cron.
- A top-level `concurrency` group serializes the entire workflow run.
- On `push` events, Dev environment is applied first, then Prd depends on Dev completing.
- On `schedule` and `workflow_dispatch`, Dev jobs are skipped (guarded by `if: github.event_name == 'push'`) and Prd jobs use conditional `if` with `always()` to handle skipped Dev dependencies.
- For Terraform-only repos without conditional Dev skipping, the Prd job simply uses `needs` to depend on the Dev job directly.

### Triggers
```yaml
name: Deploy Prd

on:
  push:
    branches:
      - main
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * 4"

permissions: {}

concurrency:
  group: ${{ github.workflow }}

jobs:
  # Define jobs here based on project type (see below for examples)
```

### Terraform Only (no application code)
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
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/dev.tfvars"
          terraform-backend-file: "backends/dev.backend.hcl"
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

  terraform-plan-and-apply-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs: terraform-plan-and-apply-dev
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/prd.tfvars"
          terraform-backend-file: "backends/prd.backend.hcl"
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### dotnet - Web App with Terraform and App Service Deploy
```yaml
  build-and-test:
    permissions:
      contents: read
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-web-ci@main
        with:
          dotnet-project: "MyOrg.MyApp.Web"
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
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/dev.tfvars"
          terraform-backend-file: "backends/dev.backend.hcl"
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

      - id: terraform-output-dev
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

    outputs:
      web_app_name: ${{ steps.terraform-output-dev.outputs.web_app_name }}
      web_app_resource_group: ${{ steps.terraform-output-dev.outputs.web_app_resource_group }}

  app-service-deploy-dev:
    permissions:
      contents: read
      id-token: write
    environment: Development
    needs: [build-and-test, terraform-plan-and-apply-dev]
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    steps:
      - uses: frasermolyneux/actions/deploy-app-service@main
        with:
          web-artifact-name: "MyOrg.MyApp.Web"
          web-app-name: ${{ needs.terraform-plan-and-apply-dev.outputs.web_app_name }}
          resource-group-name: ${{ needs.terraform-plan-and-apply-dev.outputs.web_app_resource_group }}
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

  terraform-plan-and-apply-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs: app-service-deploy-dev
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/prd.tfvars"
          terraform-backend-file: "backends/prd.backend.hcl"
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

      - id: terraform-output-prd
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

    outputs:
      web_app_name: ${{ steps.terraform-output-prd.outputs.web_app_name }}
      web_app_resource_group: ${{ steps.terraform-output-prd.outputs.web_app_resource_group }}

  app-service-deploy-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs: [build-and-test, terraform-plan-and-apply-prd]
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    steps:
      - uses: frasermolyneux/actions/deploy-app-service@main
        with:
          web-artifact-name: "MyOrg.MyApp.Web"
          web-app-name: ${{ needs.terraform-plan-and-apply-prd.outputs.web_app_name }}
          resource-group-name: ${{ needs.terraform-plan-and-apply-prd.outputs.web_app_resource_group }}
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### dotnet - Functions with Terraform and Function App Deploy
```yaml
  build-and-test:
    permissions:
      contents: read
      id-token: write
    if: github.event_name != 'push' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-func-ci@main
        with:
          dotnet-project: "MyOrg.MyApp.Functions"
          dotnet-version: 9.0.x
          src-folder: "src"

  terraform-plan-and-apply-dev:
    permissions:
      contents: read
      id-token: write
    if: github.event_name == 'push'
    environment: Development
    needs: build-and-test
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
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

    outputs:
      func_apps: ${{ steps.terraform-output.outputs.func_apps }}

  function-app-deploy-dev:
    permissions:
      contents: read
      id-token: write
    if: github.event_name == 'push'
    environment: Development
    needs: [build-and-test, terraform-plan-and-apply-dev]
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    strategy:
      matrix:
        func_app: ${{ fromJSON(needs.terraform-plan-and-apply-dev.outputs.func_apps) }}
    steps:
      - uses: frasermolyneux/actions/deploy-function-app@main
        with:
          function-app-artifact-name: "MyOrg.MyApp.Functions"
          function-app-name: ${{ matrix.func_app.name }}
          function-app-resource-group: ${{ matrix.func_app.resource_group_name }}
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}

  terraform-plan-and-apply-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs:
      - build-and-test
      - terraform-plan-and-apply-dev
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    if: |
      always() &&
      needs.build-and-test.result == 'success' &&
      (needs.terraform-plan-and-apply-dev.result == 'success' || needs.terraform-plan-and-apply-dev.result == 'skipped')
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/prd.tfvars"
          terraform-backend-file: "backends/prd.backend.hcl"
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

    outputs:
      func_apps: ${{ steps.terraform-output.outputs.func_apps }}

  function-app-deploy-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs:
      - build-and-test
      - terraform-plan-and-apply-prd
      - function-app-deploy-dev
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    if: |
      always() &&
      needs.terraform-plan-and-apply-prd.result == 'success' &&
      (needs.function-app-deploy-dev.result == 'success' || needs.function-app-deploy-dev.result == 'skipped')
    strategy:
      max-parallel: 1
      matrix:
        func_app: ${{ fromJSON(needs.terraform-plan-and-apply-prd.outputs.func_apps) }}
    steps:
      - uses: frasermolyneux/actions/deploy-function-app@main
        with:
          function-app-artifact-name: "MyOrg.MyApp.Functions"
          function-app-name: ${{ matrix.func_app.name }}
          function-app-resource-group: ${{ matrix.func_app.resource_group_name }}
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### Static Web App with Terraform and Deploy
```yaml
  build-and-test:
    permissions:
      contents: read
    if: github.event_name != 'push' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v4
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
        uses: actions/upload-artifact@v4
        with:
          name: static-site
          path: src

  terraform-plan-and-apply-dev:
    permissions:
      contents: read
      id-token: write
    if: github.event_name == 'push'
    environment: Development
    needs: build-and-test
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
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
    if: github.event_name == 'push'
    environment: Development
    needs: [build-and-test, terraform-plan-and-apply-dev]
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    steps:
      - name: Download site artifact
        uses: actions/download-artifact@v4
        with:
          name: static-site
          path: static-site

      - name: Az CLI Login
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}

      - id: static-web-app-api-key
        uses: azure/CLI@v1
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

  terraform-plan-and-apply-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs:
      - build-and-test
      - terraform-plan-and-apply-dev
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    if: |
      always() &&
      needs.build-and-test.result == 'success' &&
      (needs.terraform-plan-and-apply-dev.result == 'success' || needs.terraform-plan-and-apply-dev.result == 'skipped')
    steps:
      - uses: frasermolyneux/actions/terraform-plan-and-apply@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/prd.tfvars"
          terraform-backend-file: "backends/prd.backend.hcl"
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

  static-web-app-deploy-prd:
    permissions:
      contents: read
      id-token: write
    environment: Production
    needs:
      - build-and-test
      - terraform-plan-and-apply-prd
      - static-web-app-deploy-dev
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-prd
    if: |
      always() &&
      needs.terraform-plan-and-apply-prd.result == 'success' &&
      (needs.static-web-app-deploy-dev.result == 'success' || needs.static-web-app-deploy-dev.result == 'skipped')
    steps:
      - name: Download site artifact
        uses: actions/download-artifact@v4
        with:
          name: static-site
          path: static-site

      - name: Az CLI Login
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}

      - id: static-web-app-api-key
        uses: azure/CLI@v1
        with:
          inlineScript: |
            static_web_app_api_key=$(az staticwebapp secrets list -n ${{ needs.terraform-plan-and-apply-prd.outputs.static_web_app_name }} -o tsv --query properties.apiKey)
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
```

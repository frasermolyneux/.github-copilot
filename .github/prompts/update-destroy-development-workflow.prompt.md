---
name: update-destroy-development-workflow
description: Align the repository's Destroy Development GitHub Actions workflow with the standardized format. This workflow should only be added when explicitly requested by the user.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

## Applicability

This workflow should **only** be added if explicitly requested by the user. It is applicable to repositories that contain Terraform infrastructure under a `terraform/` folder.

Do **not** proactively create this workflow — only create or update it when the user specifically asks for it.

## Destroy Development

Review the existing `.github/workflows/destroy-development.yml` file in the repository. If it does not exist and the user has requested it, create a new one with the standardized configuration. If it does exist, update it to match the standardized configuration.

### Standardized Workflow

This is a manual workflow (`workflow_dispatch`) that destroys the Development environment's Terraform state. It includes a commented-out nightly schedule that can be enabled if needed. The workflow uses `frasermolyneux/actions/terraform-destroy` with dev-specific tfvars and backend configuration.

```yaml
name: Destroy Development

on:
  workflow_dispatch:
  #schedule:
  #  - cron: "0 1 * * *"

permissions: {}

jobs:
  terraform-destroy-dev:
    permissions:
      id-token: write
      contents: read
    environment: Development
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    steps:
      - uses: actions/checkout@v6

      - uses: frasermolyneux/actions/terraform-destroy@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/dev.tfvars"
          terraform-backend-file: "backends/dev.backend.hcl"
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### Notes
- The commented-out schedule can be uncommented to enable nightly teardown of the Development environment for cost savings.
- This workflow is identical across all Terraform repositories and should not require project-specific customization.
- The concurrency group prevents conflicts with other Dev environment workflows (deploy-dev, pr-verify, etc.).
```

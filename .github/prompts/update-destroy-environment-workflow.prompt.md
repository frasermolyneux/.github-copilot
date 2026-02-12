---
name: update-destroy-environment-workflow
description: Align the repository's Destroy Environment GitHub Actions workflow with the standardized format. This workflow should exist in all repositories that contain Terraform infrastructure.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

## Applicability

This workflow should exist in **all repositories that contain Terraform infrastructure** (i.e., a `terraform/` folder with backend configs and tfvars for dev/prd environments).

If the repository does not contain Terraform, do **not** create this workflow.

## Destroy Environment

Review the existing `.github/workflows/destroy-environment.yml` file in the repository. If it does not exist and the project contains Terraform, create a new one with the standardized configuration. If it does exist, update it to match the standardized configuration.

### Standardized Workflow

This is a manual workflow (`workflow_dispatch`) with an environment choice input (`dev` or `prd`). It dynamically selects the correct GitHub environment, tfvars, and backend config based on the user's selection. The workflow uses `frasermolyneux/actions/terraform-destroy`.

```yaml
name: Destroy Environment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to destroy"
        required: true
        type: choice
        default: dev
        options:
          - dev
          - prd

permissions: {}

jobs:
  terraform-destroy:
    permissions:
      contents: read
      id-token: write
    environment: ${{ inputs.environment == 'prd' && 'Production' || 'Development' }}
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-${{ inputs.environment }}
    steps:
      - uses: frasermolyneux/actions/terraform-destroy@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: ${{ inputs.environment == 'prd' && 'tfvars/prd.tfvars' || 'tfvars/dev.tfvars' }}
          terraform-backend-file: ${{ inputs.environment == 'prd' && 'backends/prd.backend.hcl' || 'backends/dev.backend.hcl' }}
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

### Notes
- This workflow is identical across all Terraform repositories and should not require project-specific customization.
- The default environment selection is `dev` to reduce the risk of accidental production destruction.
- The `Production` environment in GitHub should have required reviewers configured as an additional safeguard.
- The concurrency group prevents conflicts with other workflows targeting the same environment.
```

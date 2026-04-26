---
description: Canonical pattern for the Destroy Environment workflow (manual workflow_dispatch with environment input). Layered on top of workflows.terraform.instructions.md.
applyTo: '**/destroy-environment.yml'
---

# `destroy-environment.yml` Pattern

Manual workflow that destroys a specific environment's Terraform-managed infrastructure. Identical across all Terraform repos except for the workflow name.

## Applicability

All repos that contain `terraform/` with both `dev` and `prd` backends/tfvars.

## Canonical workflow

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
      - uses: frasermolyneux/actions/terraform-destroy@terraform-destroy/v1.2
        with:
          terraform-folder: "terraform"
          terraform-var-file: ${{ inputs.environment == 'prd' && 'tfvars/prd.tfvars' || 'tfvars/dev.tfvars' }}
          terraform-backend-file: ${{ inputs.environment == 'prd' && 'backends/prd.backend.hcl' || 'backends/dev.backend.hcl' }}
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

## Notes

- Default `dev` to reduce risk of accidental prd destruction.
- The `Production` environment in GitHub must have required reviewers as an additional safeguard.
- This workflow is identical across repos — no project-specific customisation should be needed.

## Compliance checklist

1. Trigger is `workflow_dispatch` only with the `environment` choice input.
2. `default: dev` on the input.
3. Job environment maps `prd → Production`, otherwise `Development`.
4. Concurrency group `${{ github.repository }}-${{ inputs.environment }}`.
5. Var-file and backend-file expressions select `prd` or `dev` correctly.
6. Composite version matches `workflows.frasermolyneux-actions.instructions.md`.
7. Permissions: top-level `{}`; job has `contents: read` + `id-token: write`.

---
description: Canonical pattern for the Destroy Development workflow (nightly cron + manual dispatch that wipes the dev Terraform state). Layered on top of workflows.terraform.instructions.md and workflows.scheduling.instructions.md.
applyTo: '**/destroy-development.yml'
---

# `destroy-development.yml` Pattern

Nightly destroyer for the `Development` environment. Used to keep dev infrastructure ephemeral so deploys exercise the full bring-up path.

## Applicability

Only added when explicitly requested by the user. Applicable to repos that contain `terraform/`. Do **not** create proactively.

## Canonical workflow

```yaml
name: Destroy Development

on:
  workflow_dispatch:
  schedule:
    - cron: "M 23 * * *"   # See ops clock for this repo's allocated minute

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

      - uses: frasermolyneux/actions/terraform-destroy@terraform-destroy/v1.2
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/dev.tfvars"
          terraform-backend-file: "backends/dev.backend.hcl"
          AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

## Notes

- The cron minute is staggered across repos (every 5 min from 23:00 UTC). Get the slot from `docs/ops-clock.md` — see `workflows.scheduling.instructions.md`.
- This works in tandem with the `terraform-state-check-dev` pattern in `deploy-prd.yml` so the next deploy rebuilds the environment.
- Concurrency group `${{ github.repository }}-dev` prevents racing with `deploy-dev` / `pr-verify`.

## Compliance checklist

1. Triggers: `workflow_dispatch` and a daily cron at 23:** UTC.
2. Cron minute matches the repo's slot in `docs/ops-clock.md`.
3. Job environment is `Development`.
4. Var-file `tfvars/dev.tfvars`, backend-file `backends/dev.backend.hcl`.
5. Concurrency group `${{ github.repository }}-dev`.
6. Composite version matches `workflows.frasermolyneux-actions.instructions.md`.
7. Permissions: `id-token: write`, `contents: read`.

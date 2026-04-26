---
description: Universal rules for every GitHub Actions workflow in the frasermolyneux organisation. Applies ambiently to all workflow files. Lower-specificity layer — category and per-workflow instructions take precedence on conflict.
applyTo: '.github/workflows/**/*.yml'
---

# Universal Workflow Standards

These rules apply to **every** workflow YAML file across the organisation. They define the baseline; category-level rules (`workflows.terraform.*`, `workflows.dotnet.*`, etc.) and per-workflow rules (`workflows.<name>.instructions.md`) layer on top.

## Filename and `name`

- The workflow `name:` should be the human-readable form of the filename (`build-and-test.yml` → `name: Build and Test`).
- One workflow per file; do not combine unrelated triggers.

## Permissions (always least privilege)

- Always set top-level `permissions: {}` to drop all default permissions.
- Grant per-job permissions explicitly. Common combinations:
  - Build / read-only jobs: `contents: read`
  - OIDC / Azure auth: `id-token: write` + `contents: read`
  - PR comments / labels: `pull-requests: write`
  - Code scanning: `security-events: write`, `actions: read`

```yaml
permissions: {}

jobs:
  example:
    permissions:
      contents: read
      id-token: write
```

## Runners

- Use `runs-on: ubuntu-latest`. Do not pin runner versions or use self-hosted runners.

## Pinned action versions

Use these exact pinned versions across all workflows:

| Action | Pin |
|---|---|
| `actions/checkout` | `@v6` |
| `actions/setup-dotnet` | `@v5` |
| `actions/setup-python` | `@v5` |
| `actions/setup-node` | `@v6` |
| `actions/upload-artifact` | `@v7` |
| `actions/download-artifact` | `@v7` |
| `actions/dependency-review-action` | `@v4` |
| `azure/login` | `@v3` |
| `azure/CLI` | `@v2` |
| `dependabot/fetch-metadata` | `@v3` |
| `ncipollo/release-action` | `@v1` |

For `frasermolyneux/actions/*` composites see `workflows.frasermolyneux-actions.instructions.md` — always pin to the specific tag (e.g. `@dotnet-ci/v1.4`), never `@main`.

## Authentication: OIDC only

- **Never** commit Azure client secrets or use service-principal passwords. All Azure auth uses OIDC federated credentials.
- Pass Azure identity via repository variables: `vars.AZURE_CLIENT_ID`, `vars.AZURE_TENANT_ID`, `vars.AZURE_SUBSCRIPTION_ID`. Never put these in `secrets`.
- Jobs that use Azure require `permissions.id-token: write`.

## Concurrency

- For environment-scoped jobs (anything that mutates dev or prd state, deploys an app, or runs Terraform), set:

  ```yaml
  concurrency:
    group: ${{ github.repository }}-<env>
  ```

  where `<env>` is `dev` or `prd`. This serialises across all workflows touching the same environment.

- For workflows that should not overlap with themselves (e.g. `deploy-prd.yml`), additionally set workflow-level concurrency:

  ```yaml
  concurrency:
    group: ${{ github.workflow }}
  ```

## Triggers

- `workflow_dispatch` is allowed on any operational workflow to enable manual runs.
- `pull_request` triggers must include the type list: `[opened, synchronize, reopened, ready_for_review]`. Add `labeled, unlabeled` only where label-driven behaviour exists (e.g. `pr-verify.yml`).
- `push` triggers should be branch-scoped (`main`, `feature/**`, `bugfix/**`, `hotfix/**`) — never unbranched.
- For scheduled (`cron`) triggers, see `workflows.scheduling.instructions.md`. Do not invent cron times — every slot is allocated in `docs/ops-clock.md`.

## YAML style

- 2-space indentation.
- Use **block-style** sequences for `needs:`:

  ```yaml
  needs:
    - detect-changes
    - build-and-test
  ```

  Do **not** use flow-style `needs: [a, b, c]`.

- Multi-line `if:` conditions use the `|` block scalar:

  ```yaml
  if: |
    !failure() && !cancelled() &&
    needs.detect-changes.outputs.src == 'true'
  ```

- Quote string values that contain special characters or could be interpreted as a YAML type (e.g. version numbers, cron expressions).
- Use `"feature/**"`, `"bugfix/**"`, `"hotfix/**"` as the standard branch globs.

## `paths:` filters

- For repos with both source and infrastructure, prefer the `frasermolyneux/actions/detect-changes` action over `paths:` filters — it gives runtime granularity that survives `workflow_dispatch` and `schedule`.
- For terraform-only repos, `paths:` filters on the trigger are acceptable (see `workflows.terraform.instructions.md`).

## Job outputs

- When a job needs to expose data downstream, declare `outputs:` at the job level and set them via `>> $GITHUB_OUTPUT` in a step with an `id:`.
- Avoid implicit cross-job state — use outputs, not artifacts, for small values.

## Secrets

- Never log secrets. Wrap any inline-extracted secret (e.g. Static Web App API keys) with `echo "::add-mask::$value"` before exporting it.
- Repository-level secrets in use today are limited to: `GITHUB_TOKEN` (default), `SONAR_TOKEN`, `NUGET_API_KEY`. New secrets require an explicit reason.

## Bespoke per-repo workflows

These workflows are single-repo or two-repo bespoke and do **not** have a per-workflow instruction file. They must still follow this universal layer plus relevant category layers, but have no canonical template:

- `actions/.github/workflows/actions-versioning.yml`
- `actions/.github/workflows/code-quality.yml`, `devops-secure-scanning.yml`
- `.github/.github/workflows/estate-sync.yml`
- `platform-workloads/.github/workflows/feature-development.yml`, `decommission-state-rm.yml`
- `portal-core/.github/workflows/update-dashboard-from-staging.yml` (also in `portal-repository`)

When editing these, apply the universal/category rules but do not try to force them into a canonical Layer-3 template.

## See also

- `workflows.scheduling.instructions.md` — cron and ops-clock rules
- `workflows.frasermolyneux-actions.instructions.md` — composite-action catalog and pin policy
- `workflows.terraform.instructions.md` — Terraform conventions
- `workflows.dotnet.instructions.md` — .NET conventions
- `workflows.security.instructions.md` — code-quality / scanning conventions
- `workflows.<name>.instructions.md` — per-workflow canonical template + checklist

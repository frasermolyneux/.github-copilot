---
description: "Canonical decision rules and v2 templates for optional Copilot cloud-agent runtime and dependency setup."
applyTo: '.github/workflows/copilot-setup-steps.yml,.github/workflows/copilot-setup-steps.yaml'
---

# `copilot-setup-steps.yml` Pattern

Defines optional prerequisites that run before a Copilot cloud-agent session.

## Applicability

Create this workflow only when the agent needs tools or dependencies that the normal runner and repository checkout do not already provide.

## Decision rules

### No pre-agent setup required

Prefer no `.github/workflows/copilot-setup-steps.yml` at all. Copilot performs the normal repository checkout after setup, so a workflow that only checks out the repository adds no value.

### Runtime installation only

Use `frasermolyneux/actions/copilot-setup@copilot-setup/v2`, enable only the required runtime, and supply its exact repository-derived version. Omit `checkout-repo` or set it to `'false'`.

Do not install:

- multiple .NET versions by default;
- Node.js solely because a `package.json` exists;
- Python without a Python requirement.

Prefer runner-provided tools when their versions are sufficient and deterministic. Explicitly install a runtime only when the repository requires a specific version.

### Repository files required during setup

Set `checkout-repo: 'true'` only when a later setup step needs repository files. Enable only required runtimes with explicit versions, then run repository-specific deterministic commands after the shared action.

Use exact paths and lockfile-based commands, for example:

- `dotnet restore src/REPLACE_WITH_SOLUTION_OR_PROJECT`
- `npm ci --prefix REPLACE_WITH_PACKAGE_DIRECTORY`
- `bundle install --gemfile REPLACE_WITH_GEMFILE_PATH`

Do not put repository-specific restore logic inside the shared action.

### Materially different review environment

Consider a separate `copilot-code-review.yml` only when code review needs a materially different environment. Do not add one automatically.

## Release prerequisite

`copilot-setup/v2` is prepared but is not available to consumers until the rolling tag exists in `frasermolyneux/actions`. Merge and release the action first, confirm the `copilot-setup/v2` tag exists, and only then migrate or dispatch workflows that reference it.

## v2 contract

- `checkout-repo`: default `'false'`
- `checkout-fetch-depth`: default `'1'`
- `setup-dotnet`: default `'false'`; `dotnet-version` is required when enabled
- `setup-node`: default `'false'`; `node-version` is required when enabled
- `setup-python`: default `'false'`; `python-version` is required when enabled

The action does not clone `frasermolyneux/.github-copilot` or provide shared instructions through a runner checkout.

## Triggers

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

permissions: {}
```

Triggers are intentionally narrow — the workflow only re-runs when the file itself changes (so the agent picks up updated steps).

## Required job

The job **must** be named `copilot-setup-steps`, otherwise Copilot will not pick it up.

```yaml
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions: {}
    steps:
      - name: Shared Copilot setup
        uses: frasermolyneux/actions/copilot-setup@copilot-setup/v2
        with:
          setup-dotnet: 'true'
          dotnet-version: 'REPLACE_WITH_REQUIRED_DOTNET_SDK_VERSION'
```

This runtime-only example intentionally does not check out the repository.

## Deterministic restore example

```yaml
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Shared Copilot setup
        uses: frasermolyneux/actions/copilot-setup@copilot-setup/v2
        with:
          checkout-repo: 'true'
          setup-node: 'true'
          node-version: 'REPLACE_WITH_REQUIRED_NODE_VERSION'

      - name: Restore dependencies
        run: npm ci --prefix REPLACE_WITH_PACKAGE_DIRECTORY
```

## Setup command boundaries

Use setup steps to eliminate dependency-installation trial and error. Commands must be reliable and fail clearly because a setup failure skips remaining setup steps but does not prevent Copilot from starting.

Keep setup limited to prerequisites:

- use exact solution, project, package, lockfile, and working-directory paths;
- prefer `dotnet restore`, `npm ci`, and equivalent lockfile-based restores;
- do not run build, test, lint, format, Terraform plan, or other expensive validation unless it is strictly required to prepare the environment;
- do not include secrets or unnecessary cloud authentication.

## Compliance checklist

1. The workflow is absent when no pre-agent customization is required.
2. When present, the job is named `copilot-setup-steps` and triggers are limited to file-self-changes plus `workflow_dispatch`.
3. The shared action references `copilot-setup/v2` only after that tag exists.
4. Every action input is part of the v2 contract: `checkout-repo`, `checkout-fetch-depth`, `setup-dotnet`, `dotnet-version`, `setup-node`, `node-version`, `setup-python`, or `python-version`.
5. `checkout-repo` is true only when a later setup command needs repository files.
6. Only required runtimes are enabled, with explicit repository-derived versions.
7. Repository-specific restore commands are separate, deterministic steps with exact paths.
8. Setup contains prerequisites only, with no secrets or unnecessary cloud authentication.

## Validation

Use the smallest validation process:

1. Parse the workflow YAML.
2. After the `copilot-setup/v2` tag exists, run `workflow_dispatch`.
3. Inspect the Copilot session setup log.
4. Measure setup duration.
5. Confirm dependency restore completes when configured.
6. Confirm no shared repository clone occurs.
7. Confirm the agent sees repository-native instructions.

A custom code-review agent is not required for setup validation.

## Rollout ordering

1. Merge this catalog guidance with the release prerequisite intact.
2. Merge and release the prepared `actions/` change.
3. Confirm the `copilot-setup/v2` rolling tag exists.
4. Migrate only consumer repositories that need pre-agent setup.

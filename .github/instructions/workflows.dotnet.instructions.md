---
description: "Use when Conventions for any GitHub Actions workflow that builds, tests, deploys, or releases .NET projects. Layered on top of workflows.instructions.md and workflows.frasermolyneux-actions.instructions.md."
applyTo: '.github/workflows/{build-and-test,pr-verify,codequality,deploy-dev,deploy-prd,release-version-and-tag,release-publish-nuget,copilot-setup-steps}.yml'
---

# .NET Workflow Conventions

Applies to any workflow touching .NET source. Composite-action versions come from `workflows.frasermolyneux-actions.instructions.md`.

## Composite selection

Pick the right composite by project type:

| Project type | Composite |
|---|---|
| Class library / multi-project solution | `frasermolyneux/actions/dotnet-ci` |
| ASP.NET Core web app (single project to publish) | `frasermolyneux/actions/dotnet-web-ci` |
| Azure Functions project | `frasermolyneux/actions/dotnet-func-ci` |

The web/func composites require a `dotnet-project:` input (the csproj name without extension); `dotnet-ci` operates on the whole solution and does not.

## Source folder

All .NET repos use:

```yaml
src-folder: "src"
```

Do not deviate. The `src/` folder contains the `.sln` and project subfolders.

## Target framework matrix

The standard matrix is **`9.0.x` + `10.0.x`** for libraries and most apps:

```yaml
dotnet-version: |
  9.0.x
  10.0.x
```

Use a single version (`9.0.x` or `10.0.x`) only when the project's csproj explicitly targets just that framework. Functions projects often pin a single version to match the Functions runtime.

## Job permissions

- `dotnet-ci` / library builds: `contents: read`
- `dotnet-web-ci` / `dotnet-func-ci` (when used in a deploy workflow that may need OIDC for downstream): `contents: read`, `id-token: write`
- `pr-verify` jobs: add `if: github.event.pull_request.draft == false` to skip drafts.

## NBGV (Nerdbank.GitVersioning)

NuGet-publishing repos use NBGV for SemVer:

- `version.json` lives at the repo root or per-project folder.
- The `release-version-and-tag.yml` workflow installs `nbgv` as a global tool pinned to the same Nerdbank.GitVersioning version declared by the repo, calls `nbgv get-version -f json`, and outputs `semver`, `nuget_version`, `should_tag`.
- Downstream `dotnet-ci` step receives `BUILD_VERSION_OVERRIDE: ${{ needs.calculate-version.outputs.nuget_version }}` to stamp the package version.

See `workflows.release-version-and-tag.instructions.md` for the canonical job set.

## Test filtering

CI excludes integration tests by default — composites already apply `--filter "FullyQualifiedName!~IntegrationTests"`. Do not override unless you intentionally want integration tests in CI.

## Formatting verification

Workflows that build/test .NET code must enforce formatting via:

```bash
dotnet format <solution-or-src-path> --verify-no-changes
```

- Prefer running this check before `dotnet build`/`dotnet test` so style drift fails fast.
- Current pinned `frasermolyneux/actions/dotnet-ci`, `dotnet-web-ci`, and `dotnet-func-ci` versions may not include this gate; add an explicit workflow-level `dotnet format --verify-no-changes` step until the pinned composite version includes equivalent enforcement.
- If a workflow runs manual .NET commands (outside the composites), add an explicit `dotnet format --verify-no-changes` step in that workflow.

## Setup-dotnet (manual setup workflows)

When a workflow installs .NET directly (e.g. `copilot-setup-steps.yml`), use:

```yaml
- name: Setup .NET
  uses: actions/setup-dotnet@9a946fdbd5fb07b82b2f5a4466058b876ab72bb2
  with:
    dotnet-version: |
      9.0.x
      10.0.x
```

## Sonar / quality

For Sonar parameters and reusable codequality workflow inputs, see `workflows.security.instructions.md`.

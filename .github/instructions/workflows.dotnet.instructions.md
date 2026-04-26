---
description: Conventions for any GitHub Actions workflow that builds, tests, deploys, or releases .NET projects. Layered on top of workflows.instructions.md and workflows.frasermolyneux-actions.instructions.md.
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
- The `release-version-and-tag.yml` workflow installs `nbgv` as a global tool, calls `nbgv get-version -f json`, and outputs `semver`, `nuget_version`, `should_tag`.
- Downstream `dotnet-ci` step receives `BUILD_VERSION_OVERRIDE: ${{ needs.calculate-version.outputs.nuget_version }}` to stamp the package version.

See `workflows.release-version-and-tag.instructions.md` for the canonical job set.

## Test filtering

CI excludes integration tests by default — composites already apply `--filter "FullyQualifiedName!~IntegrationTests"`. Do not override unless you intentionally want integration tests in CI.

## Setup-dotnet (manual setup workflows)

When a workflow installs .NET directly (e.g. `copilot-setup-steps.yml`), use:

```yaml
- name: Setup .NET
  uses: actions/setup-dotnet@v5
  with:
    dotnet-version: |
      9.0.x
      10.0.x
```

## Sonar / quality

For Sonar parameters and reusable codequality workflow inputs, see `workflows.security.instructions.md`.

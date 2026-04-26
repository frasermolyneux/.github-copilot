---
name: update-release-version-and-tag-workflow
description: Align the repository's `.github/workflows/release-version-and-tag.yml` with the canonical pattern defined in `workflows.release-version-and-tag.instructions.md`. Only applies to NuGet-publishing repos.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Applicability

Only repos that publish NuGet packages. Indicators:
- `version.json` (Nerdbank.GitVersioning) at repo root.
- `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>` or `<IsPackable>true</IsPackable>` in csproj files.
- `Directory.Build.props` with packaging configuration.

If the repo doesn't publish NuGet packages, do not create this workflow.

## Source of truth

`.github-copilot/.github/instructions/workflows.release-version-and-tag.instructions.md` is the canonical pattern. .NET conventions come from `workflows.dotnet.instructions.md`.

## Action

1. Confirm the repo publishes NuGet packages (using the indicators above).
2. If `.github/workflows/release-version-and-tag.yml` exists, align it with the instructions file.
3. If it doesn't exist (and the repo qualifies), create it using the canonical content.
4. The `calculate-version` job is identical across repos — do not customise it.
5. Adjust `dotnet-version:` in the `dotnet-ci` job to match the project's TFMs (most libraries use the dual `9.0.x` + `10.0.x` matrix).
6. Verify the file against the compliance checklist in the instructions file before considering the task complete.

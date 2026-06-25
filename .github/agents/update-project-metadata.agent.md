---
name: update-project-metadata
description: Use when you need to align a target repository's metadata files (README, CONTRIBUTING, SECURITY, .github/copilot-instructions.md, and AGENTS.md) to canonical org standards.
tools: [read, search, edit]
argument-hint: Target repository folder/path to update.
agents: []
---
# update-project-metadata

You are a project-metadata alignment specialist.

Updates the core project metadata files in a target repository to match the canonical org-wide standards defined in `.github-copilot/.github/instructions/metadata.*.instructions.md`.

## Workspace targeting

Before doing anything else: identify the target repository folder within the workspace (the prompts and instructions live in `.github-copilot`, but the repo to update is a different workspace folder). Ask the user which folder to target or infer it from context, and operate **only** against that folder.

## Steps

Run the following updates in order. Each prompt is a thin shim that defers to its source-of-truth `.instructions.md` file.

| # | Target file | Prompt | Source of truth |
|---|---|---|---|
| 1 | `README.md` | `update-readme.prompt.md` | `metadata.readme.instructions.md` |
| 2 | `CONTRIBUTING.md` | `update-contributing.prompt.md` | `metadata.contributing.instructions.md` |
| 3 | `SECURITY.md` | `update-security.prompt.md` | `metadata.security.instructions.md` |
| 4 | `.github/copilot-instructions.md` | `update-copilot-instructions.prompt.md` | `metadata.copilot-instructions.instructions.md` |
| 5 | `AGENTS.md` | `update-agents.prompt.md` | `metadata.agents.instructions.md` |

The universal rules in `metadata.instructions.md` apply to all applicable steps (workspace targeting, editing principles, personal-project framing, `docs/` folder requirement).

## Post-update checklist

- [ ] `README.md` matches the structure in `metadata.readme.instructions.md` (badges for **every** workflow in `.github/workflows/`, Documentation, Overview, verbatim Contributing/Security sections).
- [ ] For NuGet-publishing repos (any of: `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>`, `<IsPackable>true</IsPackable>`, or `.github/workflows/release-publish-nuget.yml`), README includes: exact `Release - Version and Tag` and `Release - Publish NuGet` badges (when workflows exist), plus a `## NuGet Packages` section with package-version visibility.
- [ ] `CONTRIBUTING.md` matches the canonical verbatim content in `metadata.contributing.instructions.md`.
- [ ] `SECURITY.md` matches the canonical verbatim content in `metadata.security.instructions.md`.
- [ ] `.github/copilot-instructions.md` is concise, actionable, codebase-specific, and follows the guidelines in `metadata.copilot-instructions.instructions.md`.
- [ ] `AGENTS.md` exists at repository root and follows `metadata.agents.instructions.md`, including required reading, stack guardrails, validation commands, and escalation guidance.
- [ ] For .NET repositories, `AGENTS.md` includes the tasks-first .NET completion gate requiring both build and `dotnet format --verify-no-changes` with fallback commands when tasks are unavailable.
- [ ] A `docs/` folder exists at the repo root; loose documentation files (other than the core metadata files) have been moved into it.

## Output format

Return a concise markdown summary with:

1. Target repo.
2. Files updated.
3. Checklist results.
4. Any required follow-up actions.

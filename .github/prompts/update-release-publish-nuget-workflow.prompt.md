---
name: update-release-publish-nuget-workflow
description: Align the repository's `.github/workflows/release-publish-nuget.yml` with the canonical pattern defined in `workflows.release-publish-nuget.instructions.md`. Only applies to NuGet-publishing repos and is always paired with `release-version-and-tag.yml`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Applicability

Only repos that publish NuGet packages. Always paired with `release-version-and-tag.yml` — if one exists without the other, flag it for the user.

## Source of truth

`.github-copilot/.github/instructions/workflows.release-publish-nuget.instructions.md` is the canonical pattern. The file is identical across NuGet-publishing repos.

## Action

1. Confirm the repo publishes NuGet packages and has `release-version-and-tag.yml`.
2. If `.github/workflows/release-publish-nuget.yml` exists, align it with the instructions file.
3. If it doesn't exist (and the repo qualifies), create it using the canonical content.
4. No project-specific customisation is expected — the file should be byte-identical across NuGet-publishing repos.
5. Confirm the `NuGet` GitHub environment is configured with the `NUGET_API_KEY` secret (flag for the user if not).
6. Verify the file against the compliance checklist in the instructions file before considering the task complete.

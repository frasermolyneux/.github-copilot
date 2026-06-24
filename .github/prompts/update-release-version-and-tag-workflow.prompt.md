---
name: update-release-version-and-tag-workflow
description: Use when you need to align `.github/workflows/release-version-and-tag.yml` with the canonical organization pattern for NuGet repos.
argument-hint: "Target NuGet repo folder (for example: invision-api-client)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Confirm the repo publishes NuGet packages.
3. Load and follow `.github-copilot/.github/instructions/workflows.release-version-and-tag.instructions.md` as the source of truth.
4. Apply relevant `.NET` workflow rules from `.github-copilot/.github/instructions/workflows.dotnet.instructions.md`.
5. Update or create `.github/workflows/release-version-and-tag.yml` using canonical content.
6. Validate against the compliance checklist in the per-workflow instructions before finishing.
7. Return a concise summary of changes and any repo-specific decisions.


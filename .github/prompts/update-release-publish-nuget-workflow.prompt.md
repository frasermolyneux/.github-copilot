---
name: update-release-publish-nuget-workflow
description: Use when you need to align `.github/workflows/release-publish-nuget.yml` with the canonical organization pattern for NuGet repos.
argument-hint: "Target NuGet repo folder (for example: api-client-abstractions)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Confirm the repo publishes NuGet packages and is paired with `release-version-and-tag.yml`.
3. Load and follow `.github-copilot/.github/instructions/workflows.release-publish-nuget.instructions.md` as the source of truth.
4. Update or create `.github/workflows/release-publish-nuget.yml` using canonical content.
5. Keep this workflow aligned with the canonical pattern unless the instructions explicitly permit deviations.
6. If this workflow includes .NET build/test/publish work, ensure workflow formatting gates are enforced:
	- `dotnet format <solution-or-src-path> --verify-no-changes`
	- an explicit workflow-level format check when pinned composites do not yet provide equivalent enforcement
	- if missing, add or update workflow steps to meet the gate
7. Validate against the compliance checklist in the per-workflow instructions before finishing.
8. Return a concise summary of changes, format-gate status, and any repo-specific decisions.


---
name: update-codequality-workflow
description: Use when you need to align `.github/workflows/codequality.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: geo-location)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.codequality.instructions.md` as the source of truth.
3. Apply layered workflow rules from `.github-copilot/.github/instructions/workflows.instructions.md`, `.github-copilot/.github/instructions/workflows.security.instructions.md`, and scheduling guidance from `.github-copilot/.github/instructions/workflows.scheduling.instructions.md`.
4. Update or create `.github/workflows/codequality.yml` in the target repo to match the canonical pattern.
5. Ensure workflow formatting gates are enforced where .NET build/test/publish work is present:
	- `dotnet format <solution-or-src-path> --verify-no-changes`
	- an explicit workflow-level format check when pinned composites do not yet provide equivalent enforcement
	- if missing, add or update workflow steps to meet the gate
6. Validate against the compliance checklist in the per-workflow instructions before finishing.
7. Return a concise summary of changes, format-gate status, and any repo-specific decisions.


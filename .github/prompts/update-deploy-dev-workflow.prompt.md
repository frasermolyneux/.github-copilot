---
name: update-deploy-dev-workflow
description: Use when you need to align `.github/workflows/deploy-dev.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: travel-itinerary)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.deploy-dev.instructions.md` as the source of truth.
3. Apply layered workflow rules from `.github-copilot/.github/instructions/workflows.instructions.md` plus relevant category instructions (`workflows.dotnet`, `workflows.terraform`, `workflows.frasermolyneux-actions`).
4. Update or create `.github/workflows/deploy-dev.yml` using the canonical pattern for the target repo components.
5. Keep trigger behavior canonical (`workflow_dispatch` only unless the instructions explicitly say otherwise).
6. Ensure workflow formatting gates are enforced where .NET build/test/publish work is present:
	- `dotnet format <solution-or-src-path> --verify-no-changes`
	- an explicit workflow-level format check when pinned composites do not yet provide equivalent enforcement
	- if missing, add or update workflow steps to meet the gate
7. Validate against the compliance checklist in the per-workflow instructions before finishing.
8. Return a concise summary of changes, format-gate status, and any repo-specific decisions.


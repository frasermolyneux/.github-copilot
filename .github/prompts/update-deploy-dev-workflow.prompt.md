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
6. Validate against the compliance checklist in the per-workflow instructions before finishing.
7. Return a concise summary of changes and any repo-specific decisions.


---
name: update-destroy-environment-workflow
description: Use when you need to align `.github/workflows/destroy-environment.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: platform-connectivity)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Confirm the target repo has Terraform environment configs before creating or updating this workflow.
3. Load and follow `.github-copilot/.github/instructions/workflows.destroy-environment.instructions.md` as the source of truth.
4. Update or create `.github/workflows/destroy-environment.yml` using canonical content.
5. Keep the default environment input set to `dev` unless canonical instructions change.
6. Validate against the compliance checklist in the per-workflow instructions before finishing.
7. Return a concise summary of changes and any repo-specific decisions.


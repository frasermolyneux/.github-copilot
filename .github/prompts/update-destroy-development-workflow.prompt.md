---
name: update-destroy-development-workflow
description: Use when you need to align `.github/workflows/destroy-development.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: geo-location)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Confirm the user explicitly requested this workflow and the target repo has Terraform.
3. Load and follow `.github-copilot/.github/instructions/workflows.destroy-development.instructions.md` as the source of truth.
4. Apply schedule guidance from `.github-copilot/.github/instructions/workflows.scheduling.instructions.md`.
5. Update or create `.github/workflows/destroy-development.yml` using canonical content.
6. Validate against the compliance checklist in the per-workflow instructions before finishing.
7. Return a concise summary of changes and any repo-specific decisions.


---
name: update-copilot-setup-steps-workflow
description: Use when you need to align `.github/workflows/copilot-setup-steps.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: platform-registry)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.copilot-setup-steps.instructions.md` as the source of truth.
3. Keep critical guardrails intact: checkout `.github-copilot` to `path: .github-copilot`, and keep the job name `copilot-setup-steps`.
4. Update or create `.github/workflows/copilot-setup-steps.yml` in the target repo to match the canonical pattern.
5. Validate against the compliance checklist in the per-workflow instructions before finishing.
6. Return a concise summary of changes and any repo-specific decisions.


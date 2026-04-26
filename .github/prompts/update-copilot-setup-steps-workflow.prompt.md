---
name: update-copilot-setup-steps-workflow
description: Align the repository's `.github/workflows/copilot-setup-steps.yml` with the canonical pattern defined in `workflows.copilot-setup-steps.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.copilot-setup-steps.instructions.md` is the canonical pattern for this workflow.

## Action

1. Inspect the target repo to determine which runtimes the agent needs (.NET, Node, Python, etc.).
2. If `.github/workflows/copilot-setup-steps.yml` exists, align it with the instructions file.
3. If it doesn't exist, create it using the canonical template plus the appropriate runtime setup steps.
4. **Critical:** the `.github-copilot` checkout step MUST include `path: .github-copilot` — without it, the second checkout overwrites the main repo checkout.
5. The job MUST be named `copilot-setup-steps` or Copilot will not pick it up.
6. Verify the file against the compliance checklist in the instructions file before considering the task complete.

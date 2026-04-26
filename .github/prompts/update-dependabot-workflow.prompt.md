---
name: update-dependabot-workflow
description: Align the repository's `.github/dependabot.yml` configuration with the canonical pattern defined in `workflows.dependabot-config.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

> Note: this prompt targets the **config file** (`.github/dependabot.yml`), not a workflow. The auto-merge workflow has its own prompt (`update-dependabot-automerge`).

## Source of truth

`.github-copilot/.github/instructions/workflows.dependabot-config.instructions.md` is the canonical pattern for this file. Schedule rules come from `workflows.scheduling.instructions.md`.

## Action

1. Inspect the target repo to determine which package ecosystems apply (`nuget`, `terraform`, `github-actions`, `devcontainers`, `npm`).
2. If `.github/dependabot.yml` exists, align it with the instructions file.
3. If it doesn't exist, create it using the canonical template restricted to the applicable ecosystems.
4. Look up the repo's Sunday slot from `docs/ops-clock.md` (must match the repo's Monday codequality slot).
5. Every ecosystem must have `groups.all-updates.patterns: ["*"]`.
6. Verify the file against the compliance checklist in the instructions file before considering the task complete.

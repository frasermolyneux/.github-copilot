---
name: update-agents
description: Use when you need to generate or align a concise portable AGENTS.md for a repository.
argument-hint: "Target repo folder (for example: portal-web)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/metadata.agents.instructions.md` as the source of truth.
3. Apply universal metadata rules from `.github-copilot/.github/instructions/metadata.instructions.md`.
4. Update or create `AGENTS.md` in the target repo using `.github-copilot/templates/AGENTS.md` as the baseline.
5. Include only exact commands and constraints verified in the target repository; omit inapplicable stack sections.
6. Remove every `REPLACE_WITH_` token and any empty section.
7. Confirm the result does not duplicate `.github/copilot-instructions.md`, require shared-catalog reading, or reference `.github-copilot` through a cloud-runner path.
8. Mention setup steps only when installed tools or deterministic dependency restore materially affect the agent.
9. Return a concise summary of changes.

---
name: update-copilot-instructions
description: Use when you need to generate or align `.github/copilot-instructions.md` for a repository.
argument-hint: "Target repo folder (for example: portal-web)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/metadata.copilot-instructions.instructions.md` as the source of truth.
3. Apply universal metadata rules from `.github-copilot/.github/instructions/metadata.instructions.md`.
4. Analyze the target codebase and update `.github/copilot-instructions.md` for that repository only.
5. If the target repo is one of `portal-web`, `portal-server-events`, `portal-servers-integration`, `portal-server-agent`, or `portal-repository`, include explicit platform-settings-contract guidance that matches org standards.
6. Return a concise summary of changes and any follow-up questions.


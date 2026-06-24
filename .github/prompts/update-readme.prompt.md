---
name: update-readme
description: Use when you need to generate or align `README.md` with the canonical organization-wide structure.
argument-hint: "Target repo folder (for example: platform-workloads)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/metadata.readme.instructions.md` as the source of truth.
3. Apply universal metadata rules from `.github-copilot/.github/instructions/metadata.instructions.md`.
4. Update or create `README.md` in the target repo to match canonical structure and content rules.
5. Validate against the instruction requirements before finishing.
6. Return a concise summary of changes.


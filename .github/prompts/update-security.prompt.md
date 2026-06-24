---
name: update-security
description: Use when you need to generate or align `SECURITY.md` with the canonical organization-wide security policy.
argument-hint: "Target repo folder (for example: twenty-one)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/metadata.security.instructions.md` as the source of truth.
3. Apply universal metadata rules from `.github-copilot/.github/instructions/metadata.instructions.md`.
4. Create or replace `SECURITY.md` in the target repo with canonical content.
5. Validate against the instruction requirements before finishing.
6. Return a concise summary of changes.


---
name: update-dependabot-automerge
description: Use when you need to align `.github/workflows/dependabot-automerge.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: cod-demo-reader)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.dependabot-automerge.instructions.md` as the source of truth.
3. Update or create `.github/workflows/dependabot-automerge.yml` in the target repo using canonical content.
4. Keep this workflow byte-for-byte aligned with the canonical pattern unless the instructions explicitly permit a deviation.
5. Validate against the compliance checklist in the per-workflow instructions before finishing.
6. Return a concise summary of changes.


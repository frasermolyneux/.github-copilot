---
name: update-copilot-instructions
description: Generate or update `.github/copilot-instructions.md` for guiding AI coding agents in the target repository
---
Before updating, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder. Don't include context from other workspace folders.

Analyze the target codebase and generate or update its `.github/copilot-instructions.md` following the rules in `.github-copilot/.github/instructions/metadata.copilot-instructions.instructions.md` (and the universal rules in `.github-copilot/.github/instructions/metadata.instructions.md`).

After updating, ask the user for feedback on any unclear or incomplete sections to iterate.

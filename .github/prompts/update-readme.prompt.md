---
name: update-readme
description: Generate or update `README.md` to provide a high-level project overview and essential information for developers
---
Before updating the README, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder. Don't include context from other workspace folders.

Analyze the target codebase and generate or update its `README.md` following the structure and rules in `.github-copilot/.github/instructions/metadata.readme.instructions.md` (and the universal rules in `.github-copilot/.github/instructions/metadata.instructions.md`).

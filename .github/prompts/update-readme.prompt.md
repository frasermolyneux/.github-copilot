---
name: update-readme
description: Generate or update `README.md` to provide high level project overview and essential information for developers
---
Before updating the readme file, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder. Don't include context from other folders in the workspace.

Analyze this codebase to generate or update `README.md` following the structure and guidelines provided in `.github/instructions/readme.instructions.md`.

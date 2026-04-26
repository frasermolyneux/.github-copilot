---
name: update-contributing
description: Generate or update `CONTRIBUTING.md` with the canonical organization-wide contributing content
---
Before updating, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Replace or create `CONTRIBUTING.md` in the target folder with the verbatim canonical content defined in `.github-copilot/.github/instructions/metadata.contributing.instructions.md`. Apply the universal rules in `.github-copilot/.github/instructions/metadata.instructions.md`.

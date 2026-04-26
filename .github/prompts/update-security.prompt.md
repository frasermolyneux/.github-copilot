---
name: update-security
description: Generate or update `SECURITY.md` with the canonical organization-wide security policy
---
Before updating, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Replace or create `SECURITY.md` in the target folder with the verbatim canonical content defined in `.github-copilot/.github/instructions/metadata.security.instructions.md`. Apply the universal rules in `.github-copilot/.github/instructions/metadata.instructions.md`.

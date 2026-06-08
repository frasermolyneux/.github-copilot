---
name: update-copilot-instructions
description: Generate or update `.github/copilot-instructions.md` for guiding AI coding agents in the target repository
---
Before updating, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder. Don't include context from other workspace folders.

Analyze the target codebase and generate or update its `.github/copilot-instructions.md` following the rules in `.github-copilot/.github/instructions/metadata.copilot-instructions.instructions.md` (and the universal rules in `.github-copilot/.github/instructions/metadata.instructions.md`).

If the target repository is one of the portal settings-contract repos (`portal-web`, `portal-server-events`, `portal-servers-integration`, `portal-server-agent`, `portal-repository`), include explicit platform settings guidance:

- Canonical ownership in `XtremeIdiots.Portal.Settings.Contracts.V1`.
- Dynamic backend persistence remains `namespace + JSON string`.
- No new ad hoc namespace/property JSON parsing for migrated namespaces.
- `XtremeIdiots.Portal.ChatCommands.Abstractions.V1` remains compatibility-only until shim-removal gate closure.

After updating, ask the user for feedback on any unclear or incomplete sections to iterate.

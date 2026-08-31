---
description: "Automatic content rules for .github/copilot-instructions.md."
applyTo: '.github/copilot-instructions.md'
---
# Repository Copilot Instructions — Generation Guidelines

`.github/copilot-instructions.md` contains concise repository-wide facts and commands relevant to almost every task in that repository. Repository-native instructions are authoritative for routine work.

## Discovery

Inspect the existing repository instructions, README, build configuration, task definitions, package scripts, workflows, and top-level structure. Merge intelligently rather than replacing accurate project knowledge.

## Include

- Repository purpose, primary stack, and major component boundaries.
- Structurally important paths.
- Exact bootstrap, build, targeted test, and format commands used by the repository.
- A small number of project-specific conventions or integration boundaries that affect most changes.
- Pointers to repository-local scoped instructions for narrower rules.

For portal settings repositories, retain the established settings-contract ownership, dynamic persistence, migrated namespace parsing, compatibility, and shim-removal boundaries.

## Exclude

- Organization catalogs or lists of shared instruction files.
- Requirements to read shared material before every task.
- MCP bootstrap snippets or wording that makes MCP a second automatic instruction channel.
- Optional multi-step procedures that belong in skills or prompts.
- Specialist review or implementation personas that belong in custom agents.
- Generic language, framework, testing, Git, PR, or security advice.
- Content already stated in `AGENTS.md`; repository instructions are the canonical location.

When organization knowledge or an external contract is not stated locally, local single-repository sessions may query the `frasermolyneux-copilot` MCP catalog on demand. Multi-root sessions with `.github-copilot` deliberately open use the workspace files directly instead. Cloud agents must not require the shared repository clone merely to obtain instructions.

Target roughly 20–50 lines and verify every command and path against the repository.

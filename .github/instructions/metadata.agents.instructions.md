---
description: "Automatic content rules for the repository-root AGENTS.md execution brief."
applyTo: 'AGENTS.md'
---
# AGENTS.md — Generation Guidelines

Create `AGENTS.md` only when portability across agents or execution environments is intentional. Repository-native `.github/copilot-instructions.md` remains authoritative for routine repository work.

## Canonical role

`AGENTS.md` is a concise cross-agent execution brief. It must not repeat repository-wide facts, commands, catalogs, or policies already present in `.github/copilot-instructions.md`.

Do not require a checkout of `frasermolyneux/.github-copilot`, mandatory shared-catalog reading, or MCP access. Link only to repository-local scoped documentation that the agent may need for a particular work area.

Mention Copilot setup steps only when installed tools or restored dependencies materially affect agent execution. Never describe `.github-copilot` as a runner-relative path or imply that setup clones shared instructions; repository-native instructions and skills are authoritative.

## Required content

Include only applicable sections:

1. **Repository purpose and stack** — a few accurate lines.
2. **Key locations** — only paths that explain the repository structure.
3. **Commands** — exact, verified bootstrap, build, targeted test, and format commands for this repository.
4. **Repository-specific constraints** — non-obvious implementation boundaries not already stated in repository instructions.
5. **Scoped documentation** — repository-local links with a clear condition for consulting each one.
6. **Do not** — a short list of material repository-specific risks.

Omit a command or section when it does not apply. Never include simultaneous generic .NET and Terraform examples, generic PR procedures, review-agent processes, personal Git preferences, tenant/platform catalogs, or pre-PR checklists.

## Generation process

1. Read the existing repository instructions and inspect the actual stack, scripts, workflows, and important directories.
2. Preserve accurate repository-specific content from an existing `AGENTS.md`.
3. Start from `templates/AGENTS.md`, replacing every `REPLACE_WITH_` token.
4. Remove empty or inapplicable sections.
5. Confirm every command and path resolves within the target repository.
6. Confirm the result adds portable execution value without duplicating `.github/copilot-instructions.md`.

Target roughly 25–60 lines. Prefer direct bullets and exact commands over explanatory prose.

## Cross-references

- `metadata.instructions.md` — universal metadata editing rules.
- `metadata.copilot-instructions.instructions.md` — repository-wide instruction guidance.
- `templates/AGENTS.md` — concise generation skeleton.

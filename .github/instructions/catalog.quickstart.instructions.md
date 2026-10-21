---
description: "Reference for choosing a Copilot customization primitive and retrieving organization guidance on demand."
---
# Catalog Quickstart

Routine work starts with the current repository's native instructions. Use this catalog only when the task needs organization guidance or an external contract not stated locally.

## Choose the primitive

- **Instructions** — path-scoped automatic rules when `applyTo` is present; manual/reference guidance when it is absent.
- **Skills** — optional multi-step procedures, such as `nuget-dependency-boundary` when an unpublished cross-repository NuGet version blocks work.
- **Prompt files** — manually invoked VS Code Local workflows.
- **Custom agents** — manually selected specialist personas or tool boundaries.
- **MCP** — targeted retrieval of this catalog from a local single-repository session.

## Access path

- In a multi-root workspace where `.github-copilot` is deliberately open, read the relevant files directly.
- In a local single-repository session, query MCP only for the missing topic.
- Treat instructions without `applyTo` as intentional on-demand references selected explicitly or through MCP discovery.
- Do not use MCP and direct workspace files for the same information.
- Cloud coding agents use repository-native instructions and skills; they do not need a shared-repository clone merely for guidance.

## Targeted MCP discovery

1. Use `recommend_entries({ task })` when the exact entry is unknown.
2. Use the relevant `search_*` or focused `list_*` tool.
3. Retrieve only the selected instruction, prompt, agent, or skill with `get_*`.
4. Use `get_catalog` only when a top-level inventory or freshness check is actually needed.

Examples:

- Workflow alignment: retrieve the matching `workflows.*` instruction, then manually invoke a prompt or custom agent only if desired.
- Metadata generation: retrieve the relevant `metadata.*` instruction.
- Unpublished NuGet dependency: retrieve the `nuget-dependency-boundary` skill.
- Review: retrieve applicable scoped instructions; manually select the `code-review` agent only when a delegated review is requested.

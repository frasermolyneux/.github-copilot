---
description: "Use when Guidelines for generating or updating a repository's .github/copilot-instructions.md file for AI coding agents."
applyTo: '.github/copilot-instructions.md'
---
# .github/copilot-instructions.md — Generation Guidelines

`.github/copilot-instructions.md` provides repo-specific context that helps an AI coding agent be immediately productive in that codebase. Apply the universal rules in `metadata.instructions.md` first.

## Discovery

Before writing, run a single glob across the target repo to source any existing AI conventions:

```
**/{.github/copilot-instructions.md,AGENT.md,AGENTS.md,CLAUDE.md,.cursorrules,.windsurfrules,.clinerules,.cursor/rules/**,.windsurf/rules/**,.clinerules/**,README.md}
```

If `.github/copilot-instructions.md` already exists, **merge intelligently** — preserve valuable content and update only the outdated or inaccurate sections.

## What to focus on

Concentrate on knowledge an AI agent cannot easily infer from inspecting individual files:

- **Big-picture architecture** — major components, service boundaries, data flows, and the "why" behind structural decisions (requires reading multiple files to understand).
- **Critical developer workflows** — non-obvious build, test, and debugging commands; how to run a single test; CI quirks.
- **Project-specific conventions** that differ from common practices in the language/framework.
- **Integration points and external dependencies** — APIs consumed, services produced, cross-component communication patterns.

When the target repo is one of the portal settings consumers (`portal-web`, `portal-server-events`, `portal-servers-integration`, `portal-server-agent`) or the owner (`portal-repository`), include explicit guidance for:

- Canonical settings contracts package ownership (`XtremeIdiots.Portal.Settings.Contracts.V1` in `portal-repository`).
- Dynamic repository persistence (`Namespace` + JSON string) and no typed settings transport rewrite.
- No reintroduction of ad hoc namespace/property JSON parsing in runtime paths for migrated namespaces.
- Compatibility-only status of `XtremeIdiots.Portal.ChatCommands.Abstractions.V1` and shim-removal gate requirements.

## MCP catalog snippet

Every generated `.github/copilot-instructions.md` **must include** the bootstrap snippet below, verbatim, as a top-level section. It tells MCP-capable agents (VS Code Copilot Chat, Copilot CLI, GitHub Copilot App, Claude Desktop, etc.) to call the org catalog server when one is wired into the client.

The snippet is intentionally **conditional**: it reads as a no-op in a repo where no MCP server is configured, and activates cleanly once one is. Do not rephrase it to claim a server "is" configured — local MCP wiring (user-level `~/.copilot/mcp-config.json` or VS Code user `mcp.json`) is optional and per-developer; the coding agent reads the checked-out `.github-copilot` files directly.

Use this exact text (this file is the source-of-truth; future wording changes flow through here and the parallel section in `metadata.agents.instructions.md`):

````markdown
## Org conventions via MCP (when available)

If a `frasermolyneux-copilot` MCP server is configured in your client (`~/.copilot/mcp-config.json`, VS Code user `mcp.json`, or an equivalent stdio MCP wire-up), **prefer its catalog tools** over your own assumptions when answering questions about org standards, branching, workflows, Terraform, .NET projects, Azure patterns, or shared library / platform consumption contracts. The catalog source-of-truth lives in `frasermolyneux/.github-copilot` — see `mcp-server/README.md` there for the tool contract.

This is **complementary** to the file-load model: if `./.github-copilot/` is checked out in the runner (per `copilot-setup-steps.yml`), continue to read those files directly. If both are available, prefer MCP for freshness. If no MCP server is configured in your client, treat this section as a no-op and fall back to the file paths above.
````

See `mcp-server/README.md` in `frasermolyneux/.github-copilot` for the tool surface details, content-root resolution, and wire-up snippets per client.

## What to avoid

- Generic advice ("write tests", "handle errors", "follow SOLID").
- Aspirational practices the codebase does not yet follow.
- Repeating content that is already obvious from the README or standard tooling.
- Documenting individual file contents — point to exemplar files instead.

## Style and length

- Concise and actionable; target ~20–50 lines of markdown.
- Use markdown structure (headings, bullets, fenced code blocks for commands).
- Include concrete examples drawn from the codebase (file paths, type names, command lines).
- Reference key files/directories that exemplify important patterns (e.g., "see `src/Foo/Bar.cs` for the repository pattern").

## Iteration

After updating, ask the user for feedback on any unclear or incomplete sections so the file can be iterated.

## Reference

VS Code instructions documentation: https://aka.ms/vscode-instructions-docs

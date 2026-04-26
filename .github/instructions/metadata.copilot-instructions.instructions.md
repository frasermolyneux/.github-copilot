---
description: Guidelines for generating or updating a repository's .github/copilot-instructions.md file for AI coding agents.
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

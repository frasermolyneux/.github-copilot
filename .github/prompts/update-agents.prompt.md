---
name: update-agents
description: Use when you need to generate or align AGENTS.md for a repository, including the .NET build+format sign-off gate.
argument-hint: "Target repo folder (for example: portal-web)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/metadata.agents.instructions.md` as the source of truth.
3. Apply universal metadata rules from `.github-copilot/.github/instructions/metadata.instructions.md`.
4. Update or create `AGENTS.md` in the target repo using `.github-copilot/templates/AGENTS.md` as the baseline.
5. If the target repo is a .NET repo (for example it contains `.csproj`, `.sln`, `.slnx`, or `Directory.Build.props`), enforce all of the following in `AGENTS.md`:
   - Include `dotnet format <solution-or-src-path> --verify-no-changes` in the build/test/format guidance.
   - Include an explicit .NET completion/sign-off gate requiring both build and format validation.
   - State that VS Code tasks should be used first when available, with fallback commands when tasks are missing.
   - Ensure pre-PR checks explicitly include the .NET tasks-first/fallback validation expectation.
6. If the target repo is not a .NET repo, align `AGENTS.md` to standard structure and skip the .NET-only gate, then report that skip clearly.
7. Validate against instruction requirements before finishing.
8. Return a concise summary of changes.

# frasermolyneux Copilot Instructions

1. Treat this repo as a companion to any active project; always open it in the same VS Code workspace.
2. Default shell is `pwsh.exe` on Windows; never run destructive commands (`git reset --hard`, `git clean -fd`).
3. Use ASCII unless editing a file that already contains non-ASCII characters.
4. Reference repository paths with backticks and prefer relative paths from the workspace root.
5. Align instructions, prompts, agents, and MCP integrations with the official VS Code guides for [custom instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions), [prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files), [custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents), and [MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers); cite the applicable doc in each file.
6. When editing instructions, prompts, or agents, read the matching `.github/instructions/*.instructions.md` guide first so globs, metadata, and self-checklists remain accurate.
7. Keep metadata (names, tool lists, agent IDs) consistent across related instructions, prompts, and agents so handoffs work without manual fixes.
8. Add links only from official GitHub or Microsoft domains.
9. For documentation under `docs/`, keep tone concise, describe workflows first, references second.
10. When creating new templates, mirror the files in `/templates` and update the related instruction file.
11. Verify work by summarizing file changes and recommending next steps (tests, reviews, deployments).

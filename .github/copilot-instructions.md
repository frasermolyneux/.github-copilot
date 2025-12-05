# frasermolyneux Copilot Instructions

1. Treat this repo as a companion to any active project; always open it in the same VS Code workspace.
2. Default shell is `pwsh.exe` on Windows; never run destructive commands (`git reset --hard`, `git clean -fd`).
3. Use ASCII unless editing a file that already contains non-ASCII characters.
4. Reference repository paths with backticks and prefer relative paths from the workspace root.
5. When editing instructions, prompts, or agents, read the matching `.github/instructions/*.instructions.md` guide first.
6. Add links only from official GitHub or Microsoft domains.
7. For documentation under `docs/`, keep tone concise, describe workflows first, references second.
8. When creating new templates, mirror the files in `/templates` and update the related instruction file.
9. Verify work by summarizing file changes and recommending next steps (tests, reviews, deployments).

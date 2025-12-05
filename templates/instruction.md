# <Instruction Title>

## Scope
- Files: `<glob pattern>`
- Purpose: `<one sentence describing the quality bar>`
- Related Guides: `<links to supporting instructions in this repo or official GitHub/Microsoft docs>`

## Directives
1. `<Imperative requirement written in ASCII>`
2. `<Reference concrete files such as `docs/overview.md` when clarifying workflows>`
3. `<Call out constraints (tooling, reviews, etc.) that keep the quality bar high>`

## Tooling
- Default shell: `pwsh.exe` (avoid destructive commands like `git reset --hard`).
- Verification: `<tests/linters Copilot must run before completion>`

## Self-Check
- [ ] Directives stay imperative, ASCII, and reference `pwsh.exe` when needed.
- [ ] Links point only to GitHub or Microsoft domains.
- [ ] Scope/glob values and related guides stay accurate.
- [ ] Verification steps and tooling expectations are explicit.

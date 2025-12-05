---
name: prompt-name
description: "Short description of the workflow"
argument-hint: "key=value additionalContext=..."
agent: agent
model: "<model name or remove to inherit>"
tools:
	- tool-or-toolset
---

# <Prompt Name>

Default shell: `pwsh.exe`; never run destructive commands such as `git reset --hard` or `git clean -fd`.

**Intent**: State the one-sentence outcome Copilot must deliver.

**Inputs**
- `{{input_one}}`: Primary request or scenario summary the workflow must satisfy.
- `{{input_two}}`: Key context such as target files, environments, or business rules.

**Guardrails**
1. Run every shell command in `pwsh.exe` and avoid destructive git commands per [`../copilot-instructions.md`](../copilot-instructions.md).
2. Work inside VS Code, respect workspace settings, and reference touched files with Markdown links (example: [`docs/overview.md`](../docs/overview.md)).
3. Validate functional changes via `#tool:runTests`, targeting the suites documented in [`docs/overview.md`](../docs/overview.md); include pass/fail details.
4. If blockers arise, summarize the state, cite relevant files, and ask for direction instead of guessing; escalate using insights from [`../copilot-instructions.md`](../copilot-instructions.md).

**Validation**
- Run `#tool:runTests` on affected suites and report the command plus results.
- If tests are not applicable, state why and provide a `#tool:get_changed_files` summary of modified files and their impacts.

**Checklist**
- [ ] Header metadata is accurate (name, description, argument-hint, agent, model, tools).
- [ ] Guardrails reference `pwsh.exe`, VS Code workspace rules, `#tool:runTests`, and fallback guidance.
- [ ] Validation tells Copilot exactly how to prove success or summarize pending work.
- [ ] All referenced files use Markdown links and tooling references use `#tool:<name>` syntax.

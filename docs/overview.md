# Copilot Instruction Stack Overview

Use this document to understand how the Copilot-facing assets in this repository fit together and how to evolve them safely.

## Components
- **Repository Instructions (`.github/copilot-instructions.md`)**: always-loaded guidance for every Copilot request in this workspace.
- **Path-Specific Instructions (`.github/instructions/*.instructions.md`)**: glob-scoped rules defined via frontmatter.
- **Templates (`/templates`)**: ready-to-copy scaffolds that already conform to their respective guides.
- **Prompts (`.github/prompts/*.prompt.md`)**: reusable chat prompts wired to this repository.
- **Docs (`/docs`)**: supporting material for humans (overview, governance, change history, FAQ).

## Documentation Alignment
- [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions): dictates how `.instructions.md` files declare scope, guardrails, and validation; every template and guide links back to this doc.
- [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files): defines required frontmatter, intent, inputs, guardrails, and validation; prompts must cite their governing instruction file plus the agent they invoke.
- [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents): describes YAML metadata, section layout, and validation expectations for `.agent.md` files; reuse the same naming that prompts reference.
- [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers): sets expectations for declaring `mcp-servers`, credentials, and tool bindings so instructions, prompts, and agents talk about MCP capabilities consistently.

## Governance Workflow
1. Design or update guidance in a feature branch.
2. Validate with VS Code + GitHub Copilot by loading this repo beside a sample project.
3. Ensure each instruction/prompt/agent checklist passes and cite the relevant VS Code doc (custom instructions, prompt files, custom agents, MCP servers).
4. Submit a PR summarizing what changed, why, which official doc drove the change, and which teams should adopt it.
5. Record noteworthy changes in `docs/changelog.md` (create when first needed) including any new MCP connectivity.

## Update Principles
- Prefer small, focused instructions tailored to a path or asset type.
- Reference only official GitHub or Microsoft documentation when citing best practices, prioritizing the four VS Code customization guides listed above.
- Keep language imperative and machine-friendly to optimize Copilot interpretation.
- Document non-obvious constraints (tool availability, lint rules, testing requirements) and note which prompts or agents rely on them.
- Capture MCP server names, credentials, and security considerations once in `docs/` and link to that record from every dependent instruction, prompt, or agent.

## Interoperability Checklist
- Every prompt references the instruction file that enforced its guardrails and the agent that will execute its workflow.
- Every agent lists the prompts that can call it plus any MCP servers and `#tool:<name>` dependencies it requires.
- Every instruction that unblocks a prompt or agent links back to those assets so Copilot can preload the entire stack.
- Metadata (names, IDs, argument hints, tool lists) stays synchronized across instructions, prompts, agents, and MCP registrations.

## Validation Tips
- Use Copilot Chat's **/explain** on new instructions to confirm it interprets them correctly.
- Trigger completions in the target folder to ensure path-specific content is applied.
- Run your usual test suite or linters in the associated project to surface regressions early, and log any MCP server interactions (endpoints, credentials) used during validation so others can replay the steps.

# .github-copilot

Shared GitHub Copilot customization and an on-demand MCP catalog for the `frasermolyneux` organization.

## Customization model

Each rule or procedure has one canonical location:

| Primitive | Use |
|---|---|
| `.github/copilot-instructions.md` | Concise repository-wide facts and commands relevant to almost every task. |
| `.github/instructions/*.instructions.md` | Path-scoped automatic rules when `applyTo` is present; manual/reference entries when it is absent. |
| `AGENTS.md` | Concise portable execution brief when cross-agent support is intentional; it does not repeat repository instructions. |
| Skills | Optional reusable multi-step procedures in `.github/skills/<name>/SKILL.md`. |
| Prompt files | Manually invoked VS Code Local workflows, not automatic policy. |
| Custom agents | Manually selected specialist personas or tool boundaries. |
| MCP | On-demand access to organization standards or external/dynamic contracts missing from the current repository. |
| Hooks | Fast deterministic enforcement only, not planning, review, or full-suite validation. |

## Access strategy

- **Repository-local routine work:** use the repository's native instructions.
- **Local single-repository session needing organization knowledge:** query the `frasermolyneux-copilot` MCP catalog on demand.
- **Multi-root session with `.github-copilot` deliberately open:** read the workspace files directly; do not also query MCP for the same information.
- **Cloud coding agent:** use repository-native instructions and skills. A shared-repository checkout is not required merely to obtain instructions.
- **GitHub.com Chat:** rely on the concise repository and organization instructions supported by that surface.

Use targeted retrieval rather than reading the full catalog before work. An instruction without `applyTo` is intentionally manual/on-demand, not malformed.

## Supported surfaces

| Surface | Primary primitives |
|---|---|
| Copilot CLI | Repository instructions and AGENTS when present; skills for optional procedures; MCP on demand for missing organization knowledge. |
| VS Code Chat Local | Repository and scoped instructions automatically; prompt files manually; direct catalog files in an intentional multi-root workspace or MCP on demand in a single-repository workspace. |
| VS Code Agents / Agent Host | Repository and scoped instructions, manually selected custom agents, skills, and on-demand MCP. |
| GitHub.com Chat | Concise repository and organization instructions supported by GitHub.com. |
| Copilot App | Repository context and skills; MCP only when configured and needed. |
| Cloud coding agent | Repository instructions, portable AGENTS guidance, and repository skills; no mandatory shared clone. |
| Copilot code review | Concise repository and scoped review instructions supported by the review surface; not prompts, custom agents, or MCP. |

## Structure

- `.github/instructions/` — path-scoped automatic instructions plus manual reference contracts and the catalog quickstart.
- `.github/prompts/` — reusable manual workflows.
- `.github/agents/` — specialist agents.
- `.github/skills/` — optional procedures.
- `templates/` — generated-file baselines.
- `mcp-server/` — TypeScript stdio catalog server.
- `docs/` — focused supporting documentation.

## Copilot cloud-agent setup

Most repositories should not have `.github/workflows/copilot-setup-steps.yml`; Copilot performs the normal repository checkout itself.

When setup is needed, `workflows.copilot-setup-steps.instructions.md` defines three distinct patterns:

1. **No setup** — omit the workflow.
2. **Runtime only** — use `copilot-setup/v2`, enable only required runtimes with exact repository-derived versions, and leave repository checkout disabled.
3. **Restore required** — enable repository checkout, then run exact deterministic restore commands such as `dotnet restore <solution-or-project>` or `npm ci` outside the shared action.

Keep setup limited to prerequisites, with no shared catalog clone, expensive validation, secrets, or unnecessary cloud authentication. A separate code-review setup workflow is considered only when review needs a materially different environment.

**Release checkpoint:** the v2 contract is prepared in `frasermolyneux/actions`, but migration must wait until the `copilot-setup/v2` tag exists.

## MCP development

```powershell
npm --prefix mcp-server ci
npm --prefix mcp-server run build
npm --prefix mcp-server run smoke
```

See [`mcp-server/README.md`](mcp-server/README.md) for local installation and the tool contract.

## References

- [Repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)
- [VS Code custom instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)
- [Custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [Agent Skills](https://agentskills.io/)
- [MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [AGENTS.md convention](https://agents.md)

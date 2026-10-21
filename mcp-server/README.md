# gh-copilot-mcp — MCP server for `.github-copilot`

A small stdio [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes the instruction, prompt, agent, and skill catalog from [`frasermolyneux/.github-copilot`](https://github.com/frasermolyneux/.github-copilot) to MCP-capable local clients.

Use it on demand from a local single-repository session when organization guidance or an external contract is not stated in that repository. In a multi-root workspace where `.github-copilot` is deliberately open, use the files directly instead of querying MCP for the same information.

See the [repository README](../README.md) for the wider purpose of the catalog itself.

## Install

There is no published npm artifact for this server (yet) and no pre-built `dist/` ships in the Git tree. Install means **clone + build**:

```sh
git clone https://github.com/frasermolyneux/.github-copilot
cd .github-copilot/mcp-server
npm ci
npm run build
node dist/index.js     # smoke-run; clients should spawn this themselves
```

## Local setup (recommended)

Use the installer script to build the server and wire up both user-level config files in one step.

```powershell
cd mcp-server
npm run install-local
```

What this updates:

- `%USERPROFILE%\.copilot\mcp-config.json` (Copilot CLI + GitHub Copilot App)
- `%APPDATA%\Code\User\mcp.json` (VS Code user profile)

The script configures a local stdio server with explicit read-only tool allowlisting and sets `GH_COPILOT_CONTENT_ROOT` to your local clone root.

If you need a custom clone path or already built assets:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-local.ps1 -HubRoot C:\path\to\.github-copilot -SkipBuild
```

### Manual wire-up snippets

All snippets below assume an already built server and explicit `GH_COPILOT_CONTENT_ROOT`.

#### GitHub Copilot CLI and GitHub Copilot App

Edit `%USERPROFILE%\.copilot\mcp-config.json` (or `~/.copilot/mcp-config.json`):

```json
{
  "mcpServers": {
    "frasermolyneux-copilot": {
      "type": "local",
      "command": "node",
      "args": ["/absolute/path/to/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "/absolute/path/to/.github-copilot"
      },
      "tools": [
        "get_catalog",
        "get_quickstart",
        "list_instruction_groups",
        "recommend_entries",
        "list_instructions", "get_instruction", "search_instructions",
        "list_prompts", "get_prompt", "search_prompts",
        "list_agents", "get_agent", "search_agents",
        "list_skills", "get_skill", "search_skills"
      ]
    }
  }
}
```

#### VS Code (user profile)

Run **MCP: Open User Configuration** from the Command Palette to open the user-profile `mcp.json` (conventional paths: Windows `%APPDATA%\Code\User\mcp.json`, macOS `~/Library/Application Support/Code/User/mcp.json`, Linux `~/.config/Code/User/mcp.json` — exact location varies by profile). Add the server under `servers` (VS Code's key, not `mcpServers`):

```json
{
  "servers": {
    "frasermolyneux-copilot": {
      "type": "stdio",
      "command": "node",
      "args": ["${userHome}/code/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "${userHome}/code/.github-copilot"
      },
      "tools": [
        "get_catalog",
        "get_quickstart",
        "list_instruction_groups",
        "recommend_entries",
        "list_instructions", "get_instruction", "search_instructions",
        "list_prompts", "get_prompt", "search_prompts",
        "list_agents", "get_agent", "search_agents",
        "list_skills", "get_skill", "search_skills"
      ]
    }
  }
}
```

Verify with **MCP: List Servers** (VS Code) or `/mcp show frasermolyneux-copilot` (CLI).

## Tools

All tools return a single text block whose body is JSON.

| Tool                      | Input                                                                            | Returns                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `get_catalog`             | `{}`                                                                             | `{ generatedAtUtc, freshness, counts, kindHelp, quickstart, instructionsByPrefix }` |
| `get_quickstart`          | `{}`                                                                             | `{ startHere, kindHelp, taskRouting, referenceInstruction }`                        |
| `list_instruction_groups` | `{}`                                                                             | `Array<{ prefix, description, count, examples }>`                                   |
| `recommend_entries`       | `{ task: string }`                                                               | `{ inferredFocus, recommendedFlow, instructions, prompts, agents, skills }`         |
| `list_instructions`       | `{ prefix?: string, applyToContains?: string, limit?: number, offset?: number }` | `{ total, offset, limit, hasMore, items }`                                          |
| `get_instruction`         | `{ name: string }`                                                               | `{ name, description, applyTo, path, frontmatter, content }`                        |
| `search_instructions`     | `{ query: string, limit?: number }`                                              | `Array<{ name, snippet, score }>`                                                   |
| `list_prompts`            | `{}`                                                                             | `Array<{ name, description, path }>`                                                |
| `get_prompt`              | `{ name: string }`                                                               | Same shape as `get_instruction`                                                     |
| `search_prompts`          | `{ query: string, limit?: number }`                                              | Same shape as `search_instructions`                                                 |
| `list_agents`             | `{}`                                                                             | `Array<{ name, description, path }>`                                                |
| `get_agent`               | `{ name: string }`                                                               | Same shape as `get_instruction`                                                     |
| `search_agents`           | `{ query: string, limit?: number }`                                              | Same shape as `search_instructions`                                                 |
| `list_skills`             | `{}`                                                                             | `Array<{ name, description, path }>`                                                |
| `get_skill`               | `{ name: string }`                                                               | Same shape as `get_instruction`                                                     |
| `search_skills`           | `{ query: string, limit?: number }`                                              | Same shape as `search_instructions`                                                 |

`name` accepts either the bare name (`patterns.api-client`) or the full filename (`patterns.api-client.instructions.md`).

Search scoring: `+3` per case-insensitive substring match in `name`, `+2` in `description` / `applyTo`, `+1` in body. Results sorted by score, tie-broken alphabetically. Default `limit` 10, max 50.

Suggested discovery flow:

1. Use repository-native instructions for routine work.
2. Call `recommend_entries({ task: ... })` when organization guidance is needed but the exact entry is unknown.
3. Use search or a focused list call, then retrieve only the selected entry.
4. Call `get_catalog` only for a top-level inventory or freshness check.

## Resources

Each file is also exposed as an MCP resource, so clients that browse `resources/list` can discover them without calling tools:

| Scheme                                         | Example URI                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `frasermolyneux-copilot://instructions/{name}` | `frasermolyneux-copilot://instructions/patterns.api-client`       |
| `frasermolyneux-copilot://prompts/{name}`      | `frasermolyneux-copilot://prompts/update-build-and-test-workflow` |
| `frasermolyneux-copilot://agents/{name}`       | `frasermolyneux-copilot://agents/code-review`                     |
| `frasermolyneux-copilot://skills/{name}`       | `frasermolyneux-copilot://skills/nuget-dependency-boundary`       |

Resource bodies are the raw `.md` file (frontmatter included), MIME type `text/markdown`.

## Content root resolution

The server needs to know where `.github/instructions/`, `.github/prompts/`, `.github/agents/`, and `.github/skills/<name>/SKILL.md` live. It looks in this order:

1. **`GH_COPILOT_CONTENT_ROOT`** — absolute path to the repository root (the folder *containing* `.github/`). **Recommended for every wire-up.** Eliminates ambiguity entirely.
2. **Walk-up fallback** — from the script's directory, ascending at most 10 levels, accepting only directories that contain the **three core catalogs** (`instructions/`, `prompts/`, `agents/`). This keeps accidental collision with a consumer repo's own `.github/instructions/` effectively impossible while still allowing `skills/` to be introduced incrementally.

On startup the server logs the resolved root and per-kind item counts to stderr (e.g. `content root: /…/.github-copilot (instructions=66, prompts=16, agents=6, skills=0)`) so a mis-resolution is visible. If nothing matches, startup fails with a clear message and non-zero exit.

## Access strategy

- Repository-native instructions are authoritative for routine work.
- Local single-repository sessions query this server only when organization knowledge is missing locally.
- Multi-root sessions with `.github-copilot` open use direct files and do not also query MCP for the same information.
- Cloud coding agents use repository-native instructions and skills. They do not require this repository to be cloned merely to obtain instructions.
- Prefer `recommend_entries`, search, and focused list calls over reading the whole catalog.
- For cloud-agent runtime or deterministic dependency setup, retrieve `workflows.copilot-setup-steps`. It prefers no setup workflow when none is needed and documents the prepared v2 contract; consumer rollout must wait until the `copilot-setup/v2` tag exists.

## Development

```sh
npm install
npm run build      # tsc → dist/
npm run smoke      # spawn dist/index.js, initialize handshake, list tools
```

No unit-test framework yet — the smoke script is the bar for v1. The codebase is intentionally small (~300 lines of TS); add a test framework when the surface area grows.

Project layout:

```
mcp-server/
|-- package.json
|-- tsconfig.json
|-- src/
|   |-- index.ts         entry: stdio transport + server bootstrap
|   |-- content.ts       content-root resolution + frontmatter loader + search
|   |-- tools.ts         catalog tool registrations
|   `-- resources.ts     per-file resource registrations
`-- scripts/
  |-- install-local.ps1  local bootstrap + config patching
  `-- smoke.mjs          manual smoke test (no framework)
```

## Caveats

- **MCP clients don't auto-load catalog content.** Tools are intentionally called only when the current repository lacks required organization knowledge.
- **`list_instructions` is intentionally paged.** Use `limit` / `offset` for browsing and `prefix` / `applyToContains` to stay out of truncation territory in chat clients.
- **Use user-level config for local surfaces.** Keep catalog MCP config out of committed `.vscode/mcp.json` in consumer repos unless you have a deliberate team-shared reason.
- **No `npx` / `github:` install path.** There is no root `package.json` in the catalog repo and no `prepare` script that builds the server post-install, so `npx github:frasermolyneux/.github-copilot` does not work. Use the clone + build path above until a published artifact exists.
- **CI is build + smoke only.** Expand to lint/release automation if package publishing is introduced.
- **Not published to npm.** Distribution is via `git clone` for now. Renaming the npm package is cheap until that changes.

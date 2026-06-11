# gh-copilot-mcp — MCP server for `.github-copilot`

A small stdio [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes the instruction, prompt, agent, and skill catalog from [`frasermolyneux/.github-copilot`](https://github.com/frasermolyneux/.github-copilot) to any MCP-capable client — VS Code Copilot Chat, Copilot CLI, GitHub Copilot App, Claude Desktop, and so on.

The catalog is the same one VS Code loads when you open `.github-copilot` as a folder in a multi-root workspace. This server makes it reachable from single-repo sessions and headless CI environments where that trick doesn't work.

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

| Tool                  | Input                               | Returns                                                       |
| --------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `get_catalog`         | `{}`                                | `{ generatedAtUtc, freshness, counts, instructionsByPrefix }` |
| `list_instructions`   | `{}`                                | `Array<{ name, description, applyTo, path }>`                 |
| `get_instruction`     | `{ name: string }`                  | `{ name, description, applyTo, path, frontmatter, content }`  |
| `search_instructions` | `{ query: string, limit?: number }` | `Array<{ name, snippet, score }>`                             |
| `list_prompts`        | `{}`                                | Same shape as `list_instructions` (no `applyTo`)              |
| `get_prompt`          | `{ name: string }`                  | Same shape as `get_instruction`                               |
| `search_prompts`      | `{ query: string, limit?: number }` | Same shape as `search_instructions`                           |
| `list_agents`         | `{}`                                | Same shape as `list_instructions`                             |
| `get_agent`           | `{ name: string }`                  | Same shape as `get_instruction`                               |
| `search_agents`       | `{ query: string, limit?: number }` | Same shape as `search_instructions`                           |
| `list_skills`         | `{}`                                | Same shape as `list_instructions`                             |
| `get_skill`           | `{ name: string }`                  | Same shape as `get_instruction`                               |
| `search_skills`       | `{ query: string, limit?: number }` | Same shape as `search_instructions`                           |

`name` accepts either the bare name (`patterns.api-client`) or the full filename (`patterns.api-client.instructions.md`).

Search scoring: `+3` per case-insensitive substring match in `name`, `+2` in `description` / `applyTo`, `+1` in body. Results sorted by score, tie-broken alphabetically. Default `limit` 10, max 50.

## Resources

Each file is also exposed as an MCP resource, so clients that browse `resources/list` can discover them without calling tools:

| Scheme                                         | Example URI                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `frasermolyneux-copilot://instructions/{name}` | `frasermolyneux-copilot://instructions/patterns.api-client`       |
| `frasermolyneux-copilot://prompts/{name}`      | `frasermolyneux-copilot://prompts/update-build-and-test-workflow` |
| `frasermolyneux-copilot://agents/{name}`       | `frasermolyneux-copilot://agents/code-review`                     |
| `frasermolyneux-copilot://skills/{name}`       | `frasermolyneux-copilot://skills/azure-compute`                   |

Resource bodies are the raw `.md` file (frontmatter included), MIME type `text/markdown`.

## Content root resolution

The server needs to know where `.github/instructions/`, `.github/prompts/`, `.github/agents/`, and `.github/skills/` live. It looks in this order:

1. **`GH_COPILOT_CONTENT_ROOT`** — absolute path to the repository root (the folder *containing* `.github/`). **Recommended for every wire-up.** Eliminates ambiguity entirely.
2. **Walk-up fallback** — from the script's directory, ascending at most 10 levels, accepting only directories that contain the **three core catalogs** (`instructions/`, `prompts/`, `agents/`). This keeps accidental collision with a consumer repo's own `.github/instructions/` effectively impossible while still allowing `skills/` to be introduced incrementally.

On startup the server logs the resolved root and per-kind item counts to stderr (e.g. `content root: /…/.github-copilot (instructions=66, prompts=16, agents=6, skills=0)`) so a mis-resolution is visible. If nothing matches, startup fails with a clear message and non-zero exit.

## Bootstrap snippet for consumer repos

Drop the following into a consumer repo's `.github/copilot-instructions.md` so any MCP-capable agent knows the catalog is available:

````markdown
## Org conventions via MCP (when available)

If a `frasermolyneux-copilot` MCP server is configured in your client (`~/.copilot/mcp-config.json`, VS Code user `mcp.json`, or an equivalent stdio MCP wire-up), **prefer its catalog tools** over your own assumptions when answering questions about org standards, branching, workflows, Terraform, .NET projects, Azure patterns, or shared library / platform consumption contracts. The catalog source-of-truth lives in `frasermolyneux/.github-copilot` — see `mcp-server/README.md` there for the tool contract.

This is **complementary** to the file-load model: if `./.github-copilot/` is checked out in the runner (per `copilot-setup-steps.yml`), continue to read those files directly. If both are available, prefer MCP for freshness. If no MCP server is configured in your client, treat this section as a no-op and fall back to the file paths above.
````

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

- **MCP clients don't auto-load catalog content.** Tools must be called explicitly. The bootstrap snippet above tells the agent to do that — without it, the agent will happily ignore the catalog.
- **Use user-level config for local surfaces.** Keep catalog MCP config out of committed `.vscode/mcp.json` in consumer repos unless you have a deliberate team-shared reason.
- **No `npx` / `github:` install path.** There is no root `package.json` in the catalog repo and no `prepare` script that builds the server post-install, so `npx github:frasermolyneux/.github-copilot` does not work. Use the clone + build path above until a published artifact exists.
- **CI is build + smoke only.** Expand to lint/release automation if package publishing is introduced.
- **Not published to npm.** Distribution is via `git clone` for now. Renaming the npm package is cheap until that changes.

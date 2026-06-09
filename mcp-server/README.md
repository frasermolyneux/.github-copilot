# gh-copilot-mcp — MCP server for `.github-copilot`

A small stdio [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes the instruction, prompt, and agent catalog from [`frasermolyneux/.github-copilot`](https://github.com/frasermolyneux/.github-copilot) to any MCP-capable client — VS Code Copilot Chat, the GitHub Copilot cloud coding agent, Copilot CLI, Claude Desktop, and so on.

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

Pin a tag or commit SHA in any production wire-up (see **Caveats**).

## Wire-up snippets

All snippets assume you have cloned and built the server somewhere on disk and substitute the absolute path to `mcp-server/dist/index.js` below. Set `GH_COPILOT_CONTENT_ROOT` to the repo root (the folder containing `.github/`) so the server does not fall back to walk-up discovery.

Pick the scope based on who you want the wire-up to apply to:

| Surface | Scope | Config path (Windows / macOS / Linux) |
|---|---|---|
| GitHub Copilot coding agent | Per-repo (committed) | `.github/copilot/mcp_config.json` |
| VS Code (workspace, advanced) | Per-repo (committed) | `.vscode/mcp.json` |
| GitHub Copilot CLI | User-level | `%USERPROFILE%\.copilot\mcp-config.json` / `~/.copilot/mcp-config.json` |
| GitHub Copilot App | User-level | shared with CLI — `%USERPROFILE%\.copilot\mcp-config.json` / `~/.copilot/mcp-config.json` |
| VS Code (user profile) | User-level | `%APPDATA%\Code\User\mcp.json` / `~/Library/Application Support/Code/User/mcp.json` / `~/.config/Code/User/mcp.json` |
| Generic stdio (Claude Desktop, etc.) | User-level | client-specific |

Note the shape difference: VS Code uses `servers`; Copilot CLI / Copilot App / Claude Desktop use `mcpServers`. Don't mix them.

### Per-repo (committed to the consumer repo)

Per-repo wire-ups live alongside the consumer's source and apply to every dev / CI run that opens the repo. Use these for the **coding agent** (where wire-up has to be in the repo because the runner has no home directory state) and, in rare cases, when you want to pin a VS Code workspace config for a team.

#### GitHub Copilot coding agent

Add a Copilot setup step that builds the server, then declare it in the agent's MCP config file (`.github/copilot/mcp_config.json` at the repo root).

`.github/workflows/copilot-setup-steps.yml`:

```yaml
- name: Install frasermolyneux-copilot MCP server
  shell: bash
  run: |
    git clone --depth 1 --branch v0.1.0 https://github.com/frasermolyneux/.github-copilot /tmp/gh-copilot
    cd /tmp/gh-copilot/mcp-server
    npm ci
    npm run build
```

`.github/copilot/mcp_config.json`:

```json
{
  "mcpServers": {
    "frasermolyneux-copilot": {
      "command": "node",
      "args": ["/tmp/gh-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "/tmp/gh-copilot"
      }
    }
  }
}
```

#### VS Code (workspace, advanced)

`.vscode/mcp.json` pins the server to a specific workspace. **For personal use, prefer the user-profile snippet below** — it covers every repo you open. Reach for the workspace file only when a team wants a shared config committed alongside the code.

```json
{
  "servers": {
    "frasermolyneux-copilot": {
      "command": "node",
      "args": ["${userHome}/code/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "${userHome}/code/.github-copilot"
      }
    }
  }
}
```

### User-level (per-dev, applies across all your repos)

User-level wire-ups live in your home directory and apply to every repo you open in the surface, with no per-repo plumbing. Standardise on these for personal day-to-day use.

#### GitHub Copilot CLI

Edit `~/.copilot/mcp-config.json` directly (Windows: `%USERPROFILE%\.copilot\mcp-config.json`), or run `/mcp add` inside an interactive `copilot` session and let it write the file for you.

```jsonc
// ~/.copilot/mcp-config.json
{
  "mcpServers": {
    "frasermolyneux-copilot": {
      "type": "local",
      "command": "node",
      "args": ["/absolute/path/to/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "/absolute/path/to/.github-copilot"
      },
      "tools": ["*"]
    }
  }
}
```

No restart needed — the CLI picks up the change immediately. Verify with `/mcp show frasermolyneux-copilot`; it should list the seven `*_instructions` / `*_prompts` / `*_agents` tools. `PATH` is inherited; any other env var the server needs must be set in `env`. Reference: [Adding MCP servers for GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).

#### GitHub Copilot App

The Copilot desktop App shares the same `~/.copilot/` engine directory as the CLI, so the **same `mcp-config.json` applies** — wire it up once and both surfaces see it. There is no separate App-specific MCP docs page at the time of writing; the file above is the practical answer, but verify against your App version's settings UI / release notes if anything looks off.

```jsonc
// %USERPROFILE%\.copilot\mcp-config.json  (Windows)
// ~/.copilot/mcp-config.json              (macOS / Linux)
{
  "mcpServers": {
    "frasermolyneux-copilot": {
      "type": "local",
      "command": "node",
      "args": ["/absolute/path/to/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "/absolute/path/to/.github-copilot"
      },
      "tools": ["*"]
    }
  }
}
```

After editing, start a fresh session in the App (existing sessions may keep their previous MCP snapshot until restarted). Verify by asking an agent to call `list_instructions` and confirming it returns the catalog rather than apologising for missing tools.

#### VS Code (user profile)

Run **MCP: Open User Configuration** from the Command Palette to open the user-profile `mcp.json` (conventional paths: Windows `%APPDATA%\Code\User\mcp.json`, macOS `~/Library/Application Support/Code/User/mcp.json`, Linux `~/.config/Code/User/mcp.json` — exact location varies by profile). Add the server under `servers` (VS Code's key, not `mcpServers`):

```json
{
  "servers": {
    "frasermolyneux-copilot": {
      "command": "node",
      "args": ["${userHome}/code/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "${userHome}/code/.github-copilot"
      }
    }
  }
}
```

Verify with **MCP: List Servers** in the Command Palette — `frasermolyneux-copilot` should appear as Running. Servers configured here apply to every workspace under that VS Code profile. Reference: [MCP servers in VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers).

#### Generic stdio MCP client (Claude Desktop, etc.)

For any other MCP-capable client (Claude Desktop, custom hosts, etc.), drop the server into the client's MCP config file using the standard `mcpServers` shape:

```json
{
  "mcpServers": {
    "frasermolyneux-copilot": {
      "command": "node",
      "args": ["/absolute/path/to/.github-copilot/mcp-server/dist/index.js"],
      "env": {
        "GH_COPILOT_CONTENT_ROOT": "/absolute/path/to/.github-copilot"
      }
    }
  }
}
```

## Tools

All tools return a single text block whose body is JSON.

| Tool | Input | Returns |
|---|---|---|
| `list_instructions` | `{}` | `Array<{ name, description, applyTo, path }>` |
| `get_instruction` | `{ name: string }` | `{ name, description, applyTo, path, frontmatter, content }` |
| `search_instructions` | `{ query: string, limit?: number }` | `Array<{ name, snippet, score }>` |
| `list_prompts` | `{}` | Same shape as `list_instructions` (no `applyTo`) |
| `get_prompt` | `{ name: string }` | Same shape as `get_instruction` |
| `list_agents` | `{}` | Same shape as `list_instructions` |
| `get_agent` | `{ name: string }` | Same shape as `get_instruction` |

`name` accepts either the bare name (`patterns.api-client`) or the full filename (`patterns.api-client.instructions.md`).

Search scoring: `+3` per case-insensitive substring match in `name`, `+2` in `description` / `applyTo`, `+1` in body. Results sorted by score, tie-broken alphabetically. Default `limit` 10, max 50.

## Resources

Each file is also exposed as an MCP resource, so clients that browse `resources/list` can discover them without calling tools:

| Scheme | Example URI |
|---|---|
| `frasermolyneux-copilot://instructions/{name}` | `frasermolyneux-copilot://instructions/patterns.api-client` |
| `frasermolyneux-copilot://prompts/{name}` | `frasermolyneux-copilot://prompts/update-build-and-test-workflow` |
| `frasermolyneux-copilot://agents/{name}` | `frasermolyneux-copilot://agents/code-review` |

Resource bodies are the raw `.md` file (frontmatter included), MIME type `text/markdown`.

## Content root resolution

The server needs to know where `.github/instructions/`, `.github/prompts/`, and `.github/agents/` live. It looks in this order:

1. **`GH_COPILOT_CONTENT_ROOT`** — absolute path to the repository root (the folder *containing* `.github/`). **Recommended for every wire-up.** Eliminates ambiguity entirely.
2. **Walk-up fallback** — from the script's directory, ascending at most 10 levels, accepting only directories that contain **all three** sibling catalogs (`instructions/`, `prompts/`, `agents/`). The three-way check makes accidental collision with a consumer repo's own `.github/instructions/` effectively impossible.

On startup the server logs the resolved root and per-kind item counts to stderr (e.g. `content root: /…/.github-copilot (instructions=66, prompts=16, agents=6)`) so a mis-resolution is visible. If nothing matches, startup fails with a clear message and non-zero exit.

## Bootstrap snippet for consumer repos

Drop the following into a consumer repo's `.github/copilot-instructions.md` so any MCP-capable agent knows the catalog is available:

````markdown
## Org conventions via MCP (when available)

If a `frasermolyneux-copilot` MCP server is configured in your client (`.vscode/mcp.json`, the GitHub Copilot coding-agent MCP config at `.github/copilot/mcp_config.json`, or an equivalent stdio MCP wire-up), **prefer its tools** over your own assumptions when answering questions about org standards, branching, workflows, Terraform, .NET projects, Azure patterns, or shared library / platform consumption contracts. The tool surface is `list_instructions`, `get_instruction`, `search_instructions`, plus the matching `_prompts` and `_agents` equivalents (seven tools total). The catalog source-of-truth lives in `frasermolyneux/.github-copilot` — see `mcp-server/README.md` there for the tool contract.

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
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts         entry: stdio transport + server bootstrap
│   ├── content.ts       content-root resolution + frontmatter loader + search
│   ├── tools.ts         seven tool registrations
│   └── resources.ts     per-file resource registrations
└── scripts/
    └── smoke.mjs        manual smoke test (no framework)
```

## Caveats

- **MCP clients don't auto-load catalog content.** Tools must be called explicitly. The bootstrap snippet above tells the agent to do that — without it, the agent will happily ignore the catalog.
- **The cloud-agent example above pins the `v0.1.0` tag.** `main` will drift; the pin avoids surprise behavioural changes inside CI runs. Bump the tag (or swap in a commit SHA via `git checkout <sha>` after clone) as new releases of `.github-copilot` ship.
- **No `npx` / `github:` install path.** There is no root `package.json` in the catalog repo and no `prepare` script that builds the server post-install, so `npx github:frasermolyneux/.github-copilot` does not work. Use the clone + build path above until a published artifact exists.
- **Cloud agent MCP support is evolving.** The wire-up above reflects the current `.github/copilot/mcp_config.json` convention. Re-check the [GitHub docs on Copilot coding agent MCP](https://docs.github.com/en/copilot) before relying on it for production workflows.
- **No CI workflow ships with this server yet.** Build/lint/publish workflows for `mcp-server/` are a deliberate follow-up.
- **Not published to npm.** Distribution is via `git clone` for now. Renaming the npm package is cheap until that changes.

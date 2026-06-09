---
description: Canonical guidance for per-repo AGENTS.md files — the cloud-agent entry point that survives outside the local VS Code workspace.
applyTo: 'AGENTS.md'
---
# AGENTS.md — Generation Guidelines

`AGENTS.md` lives at the **repository root** and is the **primary brief for the GitHub Copilot coding agent** (and any other AI agent that follows the [agents.md](https://agents.md) convention) when it runs in a cloud runner.

This file matters because the cloud agent **does not** load the layered `applyTo:` instructions in `.github-copilot/.github/instructions/`. It loads `.github/copilot-instructions.md` and (increasingly) `AGENTS.md`. Without an `AGENTS.md`, the agent works in the dark.

Apply the universal rules in `metadata.instructions.md` first.

## Required structure

Every per-repo `AGENTS.md` must contain these sections, in this order:

### 1. Heading + one-line repo summary

```markdown
# AGENTS.md — <repo name>

<one-line: what this repo is and the tech stack>
```

### 2. Required reading

Hard-coded list of files the agent **must read** before doing any work. Use repository-root-relative paths so they work in the cloud runner (where `frasermolyneux/.github-copilot` is checked out at `./.github-copilot/` by `copilot-setup-steps.yml`).

Standard required reads:

```markdown
## Required reading (read these first)

1. `.github/copilot-instructions.md` — repo-specific orientation
2. `.github-copilot/.github/instructions/personal.working-preferences.instructions.md` — Fraser's always-on rules (git hands-off, default to `main`, `code-review` gate)
3. `.github-copilot/.github/copilot-instructions.md` — org-wide context catalog
4. Stack-specific instruction files for the work area (see Stack guardrails below)
```

### 2a. Catalog via MCP (when available)

Immediately after the Required reading list, insert the bootstrap snippet below verbatim. It tells MCP-capable agents to call the org catalog server when one is wired into the client/runner. The snippet is intentionally **conditional** — it reads as a no-op in a repo where no MCP server is configured, and activates cleanly once one is. Do not rephrase it to claim a server "is" configured (consumer-repo MCP wiring is a separate, in-progress rollout). Keep this byte-identical to the version in `metadata.copilot-instructions.instructions.md` (that file is the source-of-truth).

````markdown
## Org conventions via MCP (when available)

If a `frasermolyneux-copilot` MCP server is configured in your client (`.vscode/mcp.json`, the GitHub Copilot coding-agent MCP config at `.github/copilot/mcp_config.json`, or an equivalent stdio MCP wire-up), **prefer its tools** over your own assumptions when answering questions about org standards, branching, workflows, Terraform, .NET projects, Azure patterns, or shared library / platform consumption contracts. The tool surface is `list_instructions`, `get_instruction`, `search_instructions`, plus the matching `_prompts` and `_agents` equivalents (seven tools total). The catalog source-of-truth lives in `frasermolyneux/.github-copilot` — see `mcp-server/README.md` there for the tool contract.

This is **complementary** to the file-load model: if `./.github-copilot/` is checked out in the runner (per `copilot-setup-steps.yml`), continue to read those files directly. If both are available, prefer MCP for freshness. If no MCP server is configured in your client, treat this section as a no-op and fall back to the file paths above.
````

### 3. Stack guardrails

Per-stack lists of which `standards.*` / `patterns.*` / `platform.*` / `shared.*` files apply to this repo. Pull from `.github-copilot/.github/copilot-instructions.md` and only include the layers this repo actually consumes (discovered via `terraform_remote_state` blocks, `<PackageReference>` entries, etc.).

### 4. Build / test / run commands

The exact commands the agent must use to validate its changes. Include:

- Build, test, format-check (e.g. `terraform fmt -check -recursive`, `dotnet format --verify-no-changes`).
- Single-test invocation pattern.
- Filter pattern to skip slow tests (e.g. `--filter "FullyQualifiedName!~IntegrationTests"`).
- Local dev runners (`func host start`, `dotnet watch`, `npm run watch:css`) only if relevant.

### 5. Do NOT

A short, blunt list of things the agent must not do. Standard items:

```markdown
## Do NOT

- ❌ Do not `git commit`, `git push`, force-push, rebase, reset --hard, or create/delete branches. Work on the assigned branch.
- ❌ Do not introduce client secrets, connection strings, or hard-coded subscription IDs / GUIDs. Auth is OIDC + managed identity only.
- ❌ Do not bypass `terraform fmt`, `dotnet format`, test runs, or other validation gates.
- ❌ Do not change resource naming/tagging conventions (see `standards.azure-naming.instructions.md` / `standards.azure-tagging.instructions.md`).
- ❌ Do not pull context from sibling workspace folders — only what's inside this repo and `./.github-copilot/`.
- ❌ Do not assume tools/SDKs are installed beyond what `copilot-setup-steps.yml` provisions.
```

Append repo-specific "do nots" (e.g. portal-repository-func: "Do not add FTP/RCON/Service Bus dependencies — wrong repo").

### 6. Opening the PR

A blunt, non-negotiable mandate that the agent uses the org PR template verbatim — **not** a freeform body.

```markdown
## Opening the PR

You MUST use `.github/PULL_REQUEST_TEMPLATE.md` as your PR body — do **not** write a freeform body. The org template is inherited from `frasermolyneux/.github` and GitHub pre-populates it when you open the PR. Concretely:

1. Fill `## Summary` (one line) and `Closes #<issue>`.
2. Tick the relevant `## Type of change` box.
3. Paste the **actual command output** from your Build, Tests, and Format check runs into `## Validation evidence`. Show the real summary line, not "tests passed".
4. Fill `## Risk and rollout` — blast radius, auto-deploy?, manual steps post-merge, rollback plan.
5. Tick **every** box in `## Agent attestation`.
6. Delete `## Consumer impact` only if no published contract (Abstractions / Client NuGet / Service Bus DTO / Terraform output) changed.

Complete the `## Agent attestation` section before requesting review; reviewers use it as a readiness checklist.
```

### 7. Pre-PR checks

Concrete checklist of commands the agent runs **before** opening the PR. Distinct from the PR body — these are the things the agent verifies locally so it can paste the output into `## Validation evidence`.

```markdown
## Pre-PR checks (run before you open the PR)

- [ ] Build succeeds
- [ ] Tests pass (excluding integration tests where applicable)
- [ ] Format check passes
- [ ] No new secrets / GUIDs / connection strings introduced
- [ ] Changes match the conventions referenced in Required reading
- [ ] `code-review` sub-agent run; High/Medium findings resolved or justified in the PR body
```

### 8. Escalation

A short list of conditions under which the agent must **stop and ask** rather than push forward.

Standard escalation behaviour — include verbatim at the top of every per-repo Escalation section:

```markdown
## Escalation

If you hit any of the conditions below, **open the PR as draft** and **apply the `needs-decision` label** instead of pushing forward to ready-for-review. Post a comment on the originating issue summarising what's blocking you and what decision is needed.

This protects against the agent silently expanding scope, bypassing a contract change, or merging a half-resolved review finding.
```

Then list the repo-specific conditions (missing required-reading file, scope creep into another repo, breaking contract change, unresolvable High `code-review` finding, runner tooling gap, ambiguous acceptance criteria, etc.).

The `needs-decision` label is the human's filter for "agent needs me" — humans triage these before any other PRs. The draft status keeps the PR out of the merge queue until the decision is made.

## Style and length

- **Concise and agent-friendly.** Target ~60–120 lines. Bullets and code blocks over prose.
- **Use repository-root-relative paths**, never `../../`. Paths must resolve in the cloud runner. In the **Stack guardrails** section, listing the bare basename of a file under `.github-copilot/.github/instructions/` (e.g. `tenant.subscriptions`, `standards.dotnet-project`, `patterns.api-client`) is acceptable as a terser alternative to the full path — the agent will resolve it via search. Use full paths in **Required reading** so links are click-through-friendly.
- **Avoid duplication** with `.github/copilot-instructions.md` — `AGENTS.md` is the agent-task-execution brief; `copilot-instructions.md` is the project orientation. They can reference each other.
- **Self-sufficient.** Assume the agent will not load anything beyond what is explicitly listed in Required reading.

## Iteration

After authoring/updating, ask the user for feedback on any gaps and refine. As the repo evolves (new stack, new platform consumer, new test category), update `AGENTS.md`.

## Reference template

See `.github-copilot/templates/AGENTS.md` for the canonical skeleton.

## Cross-references

- `metadata.instructions.md` — universal metadata rules
- `metadata.copilot-instructions.instructions.md` — sister file for `.github/copilot-instructions.md`
- `personal.working-preferences.instructions.md` — always-on git/branching/code-review rules
- [agents.md](https://agents.md) — the cross-tool convention this file implements
- `mcp-server/README.md` — MCP server install / wire-up / tool contract

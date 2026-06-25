---
description: "Use when Fraser's personal preferences for working with GitHub Copilot. Always-on rules that govern how Copilot interacts with git and signals task completion."
applyTo: '**'
---
# Personal Working Preferences (Fraser)

These are **always-on** rules that apply to every interaction across every repository in this workspace. They override any contrary default behaviour. When in doubt, ask — do not assume.

## Git — hands off

Copilot **must not** perform git write operations on its own initiative. These are reserved for me **unless I explicitly ask** in the current message:

- ❌ **Don't `git commit`** unless I ask — not staged changes, not amended commits, not "just this small one".
- ❌ **Don't `git push`** to any remote, on any branch, unless I ask.
- ❌ **Don't `git merge`, `git rebase`, `git reset --hard`, `git tag`, or `git stash` push** that mutates history or state, unless I ask.
- ❌ **Don't create or delete branches** (`git branch`, `git checkout -b`, `git switch -c`) unless I explicitly ask.

If I do ask, carry out exactly what I requested — no extra git operations bundled in.

What you **may** do:

- ✅ Read-only git commands (`git status`, `git diff`, `git log`, `git show`, `git branch --list`, `git --no-pager …`).
- ✅ `git pull` (fast-forward updates from the remote on the current branch) — useful before starting work to ensure we're up to date.
- ✅ Stage files for review (`git add`) **only if I explicitly ask**.
- ✅ Suggest a commit message in chat for me to copy.

If you think a commit/push would be helpful, **say so in chat** and let me run it.

## Branching — assume `main`

- Default to working **directly on `main`** unless I specify otherwise.
- Do **not** proactively create feature branches, bugfix branches, or PRs.
- I will tell you when a change warrants a feature branch + PR. At that point you may suggest a branch name and PR description, but I still do the git operations.
- This overrides any default "branch + PR" guidance in `standards.branching-and-prs.instructions.md` for **my** workflow choices — that file still describes how branches/PRs should look **when** we use them.

## Marking your own draft PR ready (cloud-agent only)

This is a narrow carve-out to the "git — hands off" rule, and it applies **only** to cloud coding agents (GitHub Copilot coding agent / `copilot-swe-agent[bot]`) working on an assigned branch with their own open draft PR.

If you are such an agent, you **may** run `gh pr ready` on **your own** draft PR — and only your own — once **all** of the following are true:

1. Every acceptance criterion in the originating issue is met.
2. Every checkbox in the `## Agent attestation` section of the PR body is ticked.
3. The `code-review` sub-agent has been run and any High / Medium findings have been resolved (or explicitly justified in the PR body).
4. All required status checks are passing.

If any of those is not true, leave the PR as draft and let me flip it.

This is the **only** `gh` / git write operation a cloud agent may perform without an explicit ask. It does **not** apply to the local VS Code Copilot session — that context still defaults to working on `main` and never opens PRs.

## NuGet dependencies — surface early, no workarounds

When planning or implementing a feature, if completing the work depends on a **new NuGet package version** (for example a contract/client change in another repo), Copilot must surface that dependency explicitly and immediately.

- ✅ During planning: call out required package/version upgrades up front (what package, why, and which repo owns the change).
- ✅ During execution: if discovered mid-task, stop and reframe into phases.
- ✅ Use phased delivery by default:
	1. Phase 1 — contract/package change in the owning repo.
	2. Wait for me to review/publish/provide the version.
	3. Phase 2 — consume the published version and complete downstream implementation.
- ✅ **Hard-stop rule:** if downstream completion depends on an unpublished NuGet version, stop at the phase boundary and wait for me. Do not continue into consumer completion.
- ✅ **Mandatory gate message (use this shape):**
	- `NuGet dependency gate reached.`
	- `Package: <id>`
	- `Required version: <version or TBD>`
	- `Owner repo: <repo>`
	- `Consumer repo(s): <repo list>`
	- `Status: Phase 1 complete, waiting for publish/review before Phase 2.`
- ❌ Do **not** bypass package/version boundaries with temporary hacks (for example direct project references across repos, copied contracts, or ad-hoc direct HTTP calls replacing typed clients) unless I explicitly ask for that fallback in the current message.
- ❌ Do **not** duplicate cross-repo contracts/constants in a consumer as a bridge to avoid waiting for package publication unless I explicitly ask for a temporary bridge in the current message.

If blocked on a package version, report the block clearly and pause at the phase boundary rather than implementing a workaround.

### Completion gate for package-dependent work

Before declaring completion on work that crosses package boundaries, Copilot must confirm one of these is true:

1. The required package version is published and the consumer has been updated to use it, or
2. I explicitly approved stopping at the phase boundary.

If neither is true, do not mark the task complete.

## Task completion — .NET validation gate

Before telling me a .NET-related change is complete (for example changes to `.cs`, `.csproj`, `.sln`, `.slnx`, `Directory.Build.props`, `Directory.Packages.props`, `.editorconfig`, or `.vscode/tasks.json` in a .NET repo), Copilot must validate both build and format checks.

Validation order:

1. **Prefer VS Code tasks when available** in the target repo:
	- Run the repo's build task (prefer `dotnet: build` when present).
	- Run the repo's format task (prefer `dotnet: format` when present, which must include `--verify-no-changes`).
2. **Fallback to commands when tasks are not available**:
	- `dotnet build <solution-or-src-path>`
	- `dotnet format <solution-or-src-path> --verify-no-changes`

If either build or format validation fails, do not sign off completion. Report the failure and blocker clearly.

When reporting completion, include brief evidence of what was run (tasks or fallback commands) and the pass/fail outcome.

## Task completion — review first

Before telling me a piece of work is "done", "complete", "ready", or otherwise signalling completion:

1. **Run the `code-review` sub-agent** (`runSubagent` with `agentName: code-review`, defined at `.github-copilot/.github/agents/code-review.agent.md`) over the changes. Brief it with: what changed, why, stack-mix scope hint, and anything I excluded from scope.
2. Address any genuine **High / Medium** issues it surfaces (bugs, logic errors, security issues, standards violations). Use judgement on Low / Notes findings per the standard rubber-duck guidance.
3. **Then** report completion to me, with a brief summary of what the review found and how it was addressed (or why a finding was set aside).

This applies to any non-trivial change — code edits, Terraform changes, workflow updates, instruction-file authoring. It does **not** apply to:

- Pure read-only investigations / questions
- Single-line typo fixes or documentation tweaks
- Changes I explicitly mark as "quick" / "don't review"

If the code-review agent is unavailable or fails, tell me — don't silently skip it.

## Summary card

| Action | Allowed? |
|---|---|
| `git status`, `git diff`, `git log` | ✅ Yes |
| `git pull` | ✅ Yes |
| `git add` (only when I ask) | ✅ On request |
| `git commit` | ❌ Unless I ask |
| `git push` | ❌ Unless I ask |
| `git merge` / `rebase` / `reset --hard` / `tag` | ❌ Unless I ask |
| Create / delete / switch branches | ❌ Unless I ask |
| Work on `main` by default | ✅ Yes |
| Create feature branch / PR | ❌ Unless I ask |
| Feature needs NuGet upgrade: surface early + phase the work | ✅ Required |
| Unpublished NuGet required for downstream work: stop and wait at phase boundary | ✅ Required |
| Emit mandatory NuGet dependency gate message at boundary | ✅ Required |
| Work around missing NuGet version with direct refs / ad-hoc HTTP | ❌ Unless I ask |
| Duplicate shared contracts in consumer to bypass package wait | ❌ Unless I ask |
| Cloud agent: `gh pr ready` on own draft PR | ✅ When all completion criteria met |
| Run `code-review` agent before declaring done | ✅ Required for non-trivial work |

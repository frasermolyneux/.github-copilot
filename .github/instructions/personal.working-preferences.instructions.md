---
description: Fraser's personal preferences for working with GitHub Copilot. Always-on rules that govern how Copilot interacts with git and signals task completion.
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

## Task completion — review first

Before telling me a piece of work is "done", "complete", "ready", or otherwise signalling completion:

1. **Run the `code-review` sub-agent** (via the `task` tool, `agent_type: code-review`) over the changes.
2. Address any genuine issues it surfaces (bugs, logic errors, security issues). Use judgement on style/nit findings per the standard rubber-duck guidance.
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
| Run `code-review` agent before declaring done | ✅ Required for non-trivial work |

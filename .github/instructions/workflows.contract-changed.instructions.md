---
description: Canonical pattern for the Contract Changed gate workflow that fires on PRs touching published API/NuGet contract paths and requires a populated "Consumer impact" section in the PR body.
applyTo: '**/contract-changed.yml'
---
# Contract Changed Gate — `contract-changed.yml`

A path-scoped PR gate. Fires when a PR touches a repo's published-contract paths (Abstractions DTOs, Api.Client surfaces, Service Bus event DTOs / queue-name constants). Fails unless the PR body contains a non-empty `## Consumer impact` section.

Pairs with:
- The optional `## Consumer impact` section in the org PR template (`metadata.pull-request-template.instructions.md`).
- The `breaking-contract` label, applied by humans (or by the agent during escalation) when the change is non-backwards-compatible. The label itself does not gate — the section presence does. The label exists for triage / search / changelog automation downstream.

## Scope

Only add this workflow to repos that publish a contract:

| Repo | Contract paths |
|---|---|
| `portal-repository` | `src/XtremeIdiots.Portal.Repository.Abstractions.V1/**`, `src/XtremeIdiots.Portal.Repository.Abstractions.V2/**`, `src/XtremeIdiots.Portal.Repository.Api.Client.Testing/**`, `src/XtremeIdiots.Portal.Repository.Api.Client.V1/**`, `src/XtremeIdiots.Portal.Repository.Api.Client.V2/**` |
| `portal-server-events` | `src/XtremeIdiots.Portal.Server.Events.Abstractions.V1/**` (NuGet consumed by `portal-server-agent` as the publisher) |
| `portal-servers-integration` | `src/XtremeIdiots.Portal.Integrations.Servers.Abstractions.V1/**`, `src/XtremeIdiots.Portal.Integrations.Servers.Api.Client.Testing/**`, `src/XtremeIdiots.Portal.Integrations.Servers.Api.Client.V1/**` |

Do **not** add this workflow to repos that only **consume** contracts (e.g. `portal-web`, `portal-sync`). Contract reviews live in the publishing repo.

## Triggers

- `pull_request` on `main`, with `paths:` scoped to the contract paths above (per-repo — see the per-repo `paths:` list in each file).
- Types `[opened, edited, reopened, ready_for_review, synchronize]` — `edited` matters: re-saving the PR body to add the Consumer impact section must re-run the gate.

## Gate behaviour

- Skip when the PR is in draft (`github.event.pull_request.draft == false`).
- Read `context.payload.pull_request.body`. Strip HTML comments first (`/<!--[\s\S]*?-->/g`) and fenced code blocks (` /```[\s\S]*?```/g `) so neither guidance comments nor pasted markdown excerpts can satisfy the gate.
- Locate the `## Consumer impact` heading. If missing — fail with guidance.
- Verify the section has at least one non-blank, non-bullet-placeholder line of actual content (i.e. not just empty `- **Contracts touched**:` placeholders). The simplest acceptance test: after stripping comments and trimming whitespace, the section body must contain at least one line that is **not** an empty placeholder bullet (`/^\s*[-*]\s+\*\*[^*]+\*\*:\s*$/`).
- On failure, the error message must mention: the missing/empty `## Consumer impact` section, the `breaking-contract` label, and that the section should be deleted entirely if no contract change was intended (in which case the PR should not have modified these paths).

## Permissions

- Workflow-level: `permissions: {}`.
- Job-level: `permissions: pull-requests: read`. No write needed — the gate only reads the PR body and sets the check status implicitly via job success/failure.

## Canonical YAML (per-repo paths substituted in)

```yaml
name: Contract Changed Gate

on:
  pull_request:
    branches: [main]
    types: [opened, edited, reopened, ready_for_review, synchronize]
    paths:
      # Replace with the repo's published-contract paths from the table above. Keep alphabetically sorted.
      - 'src/XtremeIdiots.Portal.Repository.Abstractions.V1/**'
      - 'src/XtremeIdiots.Portal.Repository.Abstractions.V2/**'
      - 'src/XtremeIdiots.Portal.Repository.Api.Client.Testing/**'
      - 'src/XtremeIdiots.Portal.Repository.Api.Client.V1/**'
      - 'src/XtremeIdiots.Portal.Repository.Api.Client.V2/**'

permissions: {}

jobs:
  consumer-impact-gate:
    name: Consumer impact section gate
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - name: Verify PR body contains a populated Consumer impact section
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';

            // Strip HTML comments — guidance comments must not satisfy the gate.
            // Then strip fenced code blocks — pasted markdown excerpts must not satisfy the gate either.
            const stripped = body
              .replace(/<!--[\s\S]*?-->/g, '')
              .replace(/```[\s\S]*?```/g, '');

            const lines = stripped.split(/\r?\n/);
            const headingIdx = lines.findIndex(l => /^##\s+Consumer impact\s*$/.test(l));

            const fail = (msg) => core.setFailed(
              msg +
              `\n\nThis PR modifies published contract paths (Abstractions or Api.Client), ` +
              `so the PR body must include a populated '## Consumer impact' section ` +
              `describing downstream impact and migration notes.\n\n` +
              `If the change is non-backwards-compatible, also apply the 'breaking-contract' label ` +
              `and bump the package major version.\n\n` +
              `If the change does NOT actually alter the published contract, revert the path changes ` +
              `or move them out of these directories — do not bypass the gate.`
            );

            if (headingIdx === -1) {
              fail(`PR body is missing the '## Consumer impact' section.`);
              return;
            }

            // Collect lines until the next '## ' heading or end of body.
            const sectionLines = [];
            for (let i = headingIdx + 1; i < lines.length; i++) {
              if (/^##\s+\S/.test(lines[i])) break;
              sectionLines.push(lines[i]);
            }

            // The section body must contain at least one non-blank line that is NOT an
            // empty placeholder bullet like "- **Breaking?**:" (label with no value).
            const placeholder = /^\s*[-*]\s+\*\*[^*]+\*\*:\s*$/;
            const meaningful = sectionLines.some(l => l.trim().length > 0 && !placeholder.test(l));

            if (!meaningful) {
              fail(`PR body has a '## Consumer impact' heading but every field is empty.`);
              return;
            }

            core.info("'## Consumer impact' section is present and populated. Gate passes.");
```

## Per-repo paths reference

When templating into a target repo, replace the `paths:` block with the matching row from the **Scope** table. Keep paths sorted alphabetically.

## Compliance checklist

1. Workflow filename is `contract-changed.yml`.
2. Lives only in the three publishing repos listed under **Scope** — not in consumer repos.
3. `on.pull_request.paths:` lists exactly the published-contract paths for that repo.
4. `on.pull_request.types:` includes `edited` (so re-saving the PR body re-runs the gate).
5. Workflow-level `permissions: {}` and job-level `permissions: pull-requests: read`.
6. Uses `actions/github-script@v7` pinned per `workflows.instructions.md`.
7. Strips HTML comments before scanning so template guidance doesn't pass the gate.
8. Fails with a message that mentions the `breaking-contract` label and the option to revert path changes if no contract change was intended.
9. Does **not** require the `breaking-contract` label — label is for triage only. The gate enforces section presence.
10. Job is skipped for draft PRs (`github.event.pull_request.draft == false`).

## Cross-references

- `workflows.instructions.md` — universal workflow rules and third-party action pins
- `workflows.coding-agent-pr-gate.instructions.md` — sister gate (PR body checklist on `coding-agent` PRs)
- `standards.branching-and-prs.instructions.md` — labels table (`breaking-contract`)
- `metadata.pull-request-template.instructions.md` — defines the `## Consumer impact` section

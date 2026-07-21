# Phase 5 · Part 1 — Add the Org Telemetry Standard & Agent Guidance

Use the `agent-customization` skill when executing this part because it changes `.instructions.md`, agent behavior, and metadata-generation guidance.

## 1.A — Add the standard

Create `.github/instructions/standards.telemetry.instructions.md` in `.github-copilot`, scoped to relevant `.cs`, `.csproj`, `appsettings*.json`, `host.json`, `.tf`, and `.tfvars` files. Encode the implemented [target policy](../telemetry-cost-optimisation-spec/target-policy.md), including:

- protected telemetry classes;
- source-side category filtering;
- successful-fast request/dependency rules;
- audit bypass requirements;
- canonical metric and bounded-cardinality rules;
- URL/query/body/secret redaction;
- alert/signal validation and equal-window measurement;
- configuration rollback and exception requirements;
- no blanket workspace sampling.

Keep the instruction concise and binary. Link to package consumption contracts for implementation detail rather than duplicating APIs.

## 1.B — Update central catalogs/contracts

Review and update in one consistent pass:

- `.github/copilot-instructions.md` — add the telemetry standard to the standards catalog and summarize the protected-signal rule.
- `.github/instructions/catalog.quickstart.instructions.md` — route telemetry cost/filtering work to the new standard and shared observability contracts.
- `.github/instructions/shared.observability-appinsights.instructions.md` — actual classic AI package config/defaults and audit/custom-event behavior.
- Add/update the OpenTelemetry consumption contract if one exists; otherwise create the canonical shared contract before referencing it.
- `.github/instructions/platform.monitoring.instructions.md` — central workspace remains the destination; consumers filter at source and avoid indiscriminate `allLogs`/`AllMetrics` when categories are configurable and unused.
- Metadata/AGENTS generation guidance so newly aligned repos inherit real validation commands and telemetry guardrails.

Do not change unrelated Azure naming, workflow, or metadata text.

## 1.C — Update review enforcement

Update `.github/agents/code-review.agent.md` to flag:

- audit/exception/failure/availability sampling or filtering;
- broad logger suppression that hides host diagnostics;
- raw URL/query/body/secret telemetry;
- custom metrics without bounded dimensions and a named consumer;
- app-local processors duplicating shared package behavior;
- telemetry changes without tests, equal-window measurement plan, or rollback;
- unpublished package-boundary workarounds.

Review findings should distinguish correctness/security failures from optional cost opportunities.

## 1.D — Validation

- Confirm every new/changed Markdown link resolves.
- Validate YAML frontmatter and `applyTo` patterns.
- Test representative path matching for `.cs`, `.csproj`, `appsettings*.json`, Azure Functions `host.json`, `.tf`, and `.tfvars` so the standard is actually loaded on every governed surface.
- Search central instructions for conflicting defaults (for example blanket 100% collection or blanket sampling).
- Run representative catalog routing/recommendation checks if the MCP server has tests.
- Run `code-review` over the instruction changes.

## Part 1 exit gate

- One canonical standard, no conflicting central guidance.
- Review agent and metadata generation enforce the same implemented policy.
- Existing application exceptions remain explicit rather than overwritten by generated text.
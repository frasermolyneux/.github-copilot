# Phase 5 · Part 3 — Align Remaining Repos & Establish Governance

## 3.A — Consume the final contract

For every role in the Phase 4 ledger:

- consume the approved shared package version if required;
- align appsettings/App Configuration selectors and Terraform app settings;
- remove superseded app-local filters/exporter duplication;
- retain documented workload-specific thresholds and exclusions;
- update repo `.github/copilot-instructions.md` and `AGENTS.md` only through the canonical metadata process when their current telemetry notes are wrong;
- run the repo's full build/test/format and infrastructure gates.

Respect NuGet phase boundaries. Do not update consumers to an unpublished version.

## 3.B — Exception register

Keep one source-controlled exception register in the specification or agreed monitoring docs. Each entry contains:

- component/role/repo and owner;
- deviation and operational reason;
- measured volume/cost impact;
- compensating alert/diagnostic control;
- approval and review date;
- objective removal criterion.

Expired exceptions fail alignment review; they do not silently renew.

## 3.C — Recurring review

Define a quarterly and post-major-release read-only review:

1. Aggregate billable GB by table, role, severity/outcome, and safe family.
2. Compare current versus prior complete periods and flag material growth.
3. Confirm current presence of availability, exception, failure, audit, and slow-call signals.
4. Inventory alerts/workbooks/dashboards before recommending removals.
5. Review exceptions and high-cardinality dimensions.
6. Record recommendations; make no direct production modifications from the review.

Prefer a runbook and reusable KQL/query file over a new always-on telemetry pipeline. Queries must follow the sensitive-data hygiene in the spec.

## 3.D — Final measurement

After all batches stabilize:

- report 7-day and 30-day workspace ingestion by table and role;
- compare against the post-17-July baseline and each phase's immediate predecessor;
- report actual cost when billing data is available;
- report protected-signal counts, alert coverage, and unresolved uncertainty;
- state explicitly that phase savings overlap and are not additive.

## Programme exit gate

- Every current role is aligned or has a current approved exception.
- Required package versions are published and consumed.
- Org guidance, shared package docs, repo configuration, and deployed behavior agree.
- Quarterly review is documented, aggregate-only, read-only, and owner-assigned.
- Final `code-review` has no unresolved High/Medium findings.
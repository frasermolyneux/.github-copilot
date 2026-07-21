# Phase 2 · Part 1 — Build the Metric Emitter & Consumer Map

This part is analysis plus a locked implementation decision. It may use read-only Azure queries and resource inventory; no metric emission changes occur here.

## 1.A — Reconcile the baseline

Using at least seven complete UTC days after Phase 1:

1. Aggregate `AppMetrics` billed size and rows by application role, metric namespace/name, and safe dimensions.
2. Normalize only well-understood suffixes (`Count`, `Successes`, `Failures`, `SuccessRate`, `MinDurationMs`, `MaxDurationMs`, `AvgDurationMs`) to identify candidate families.
3. Reconcile the family totals to the workspace `Usage` total for `AppMetrics`.
4. Keep an `Unattributed` row for every residual; do not distribute it proportionally or assume it is reducible.

## 1.B — Identify the emitter

For each material family, determine one of:

- Application `System.Diagnostics.Metrics` instrument and owning repo/type.
- OpenTelemetry/Application Insights exporter-generated aggregation.
- Azure Functions/runtime metric.
- Azure resource diagnostic `AllMetrics` flow.
- Unknown.

Search source, package implementations, Terraform diagnostic settings, deployed component configuration, and package versions. Record the stable instrument identity and dimensions. Do not infer ownership from `AppRoleName` alone when a shared Application Insights component receives multiple hosts.

## 1.C — Identify consumers

Check both source-controlled and deployed consumers:

- Azure Monitor metric alerts and scheduled-query alerts.
- Application Insights alerts.
- Workbooks, dashboards, Grafana queries, and portal dashboard JSON.
- KQL in runbooks, docs, tests, workflow verification, and application code.
- SLO/error-budget calculations and capacity decisions.

Search all workspace repos, then use read-only Azure Resource Graph/Monitor inventory for deployed definitions. Query history may be used as supporting evidence when available, but absence from history does not prove no consumer.

## 1.D — Decision table

Produce one row per family:

| Field | Required value |
| --- | --- |
| Role/component | Safe emitting role and destination component. |
| Instrument/family | Stable name/namespace and owning code/resource. |
| GB/day and rows/day | Equal complete-day baseline. |
| Dimensions/cardinality | Cardinality and any sensitive dimension risk. |
| Consumers | Named alert/workbook/dashboard/SLO/runbook, or `None found` with search evidence. |
| Classification | `Canonical keep`, `Derived remove`, `Duplicate remove`, `Platform keep`, or `Unknown keep`. |
| Replacement | KQL/metric expression or canonical instrument. |
| Owning repo/package | Where implementation belongs. |
| Rollback | Prior instrument/config/query. |

## 1.E — Design rules

- Availability: prefer one structured result per execution. Preserve the native `availabilityResults/count` and percentage series backing alerts.
- Duration: prefer a histogram or canonical duration measurement; calculate min/max/average/percentiles in queries.
- Outcome: retain count tagged by bounded outcome when this is cheaper and queryable; derive success/failure/rate. Do not introduce unbounded status/message dimensions.
- Gauges: retain the direct current measurement when min/max/average siblings merely restate exporter aggregation.
- Counters: do not emit both cumulative and per-period derivatives unless separate named consumers require both.

## Part 1 exit gate

- Decision table reviewed by monitoring and workload owners.
- Every proposed removal has a replacement/consumer migration and rollback.
- `Unknown keep` covers all uncertainty, including the historical 0.7121 GB residual until freshly attributed.
- Expected savings are ranges based only on `Derived remove`/`Duplicate remove`, and are marked non-additive with Phases 1 and 3.
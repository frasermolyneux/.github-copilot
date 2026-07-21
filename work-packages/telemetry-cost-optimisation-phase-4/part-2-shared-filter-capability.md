# Phase 4 · Part 2 — Prove the Shared Filter Capability

## 2.A — Use existing behavior first

The current shared packages already implement:

- successful-fast request filtering;
- successful-fast dependency filtering;
- retained request status codes/ranges;
- retained dependency result codes;
- slow-call retention;
- health-path and method exclusions;
- OpenTelemetry audit-log bypass;
- configurable log/trace severity.

For the selected pilot, first prove its installed package and configuration can express the required policy. Prefer app configuration only when it is correctly loaded and tested.

Passing the shared filter is not sufficient. Trace each protected class through every sampler, processor, exporter, resource setting, and workspace transformation identified in Part 1, and prove it reaches the intended Application Insights/Log Analytics destination unsampled.

## 2.B — Characterization matrix

Run equivalent tests for both shared stacks where applicable:

| Case                                                  | Expected                                                                                |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Successful dependency below threshold                 | Filtered.                                                                               |
| Successful dependency above threshold                 | Retained.                                                                               |
| Failed dependency at any duration                     | Retained.                                                                               |
| Retained dependency result code (for example 429/503) | Retained.                                                                               |
| Successful request below threshold                    | Filtered.                                                                               |
| Successful request above threshold                    | Retained.                                                                               |
| HTTP 4xx/5xx request                                  | Retained.                                                                               |
| Successful health endpoint                            | Filtered.                                                                               |
| Failed health endpoint                                | Failure/exception/resource-health evidence retained.                                    |
| Exception                                             | Retained.                                                                               |
| Audit/security event                                  | Retained with required fields.                                                          |
| Correlated failed/slow operation                      | Trace/dependency/request correlation remains usable.                                    |
| Live config change (where supported)                  | Rules reload without corrupting the pipeline.                                           |
| Host/SDK/resource sampling enabled                    | Protected classes bypass every applicable sampling stage and arrive at the destination. |

Run the matrix at two levels: deterministic unit/processor-order tests, then an end-to-end dev integration or deployed smoke test that queries aggregate destination counts for uniquely classified non-sensitive events. Include classic SDK adaptive/fixed sampling and Functions `host.json` sampling where the pilot uses them.

## 2.C — Fill only proved gaps

Potential gaps must be demonstrated by a failing test before changing a shared package. Examples:

- category prefix support rather than exact match;
- parity between classic AI and OpenTelemetry result/status handling;
- explicit audit-event bypass when a custom-event allow-list is configured;
- safe diagnostics showing aggregate filtered counts without logging payloads.

Do not add a second filter processor to an application to bypass package publication.

## 2.D — Package-first gate

If shared code changes, update tests/docs/README in its owner repo, run build/test/format, publish, then stop:

```text
NuGet dependency gate reached.
Package: <actual MX.Observability package(s)>
Required version: <published version or TBD>
Owner repo: observability-appinsights and/or observability-opentelemetry
Consumer repo(s): <pilot and mapped rollout repos>
Status: Phase 1 complete, waiting for publish/review before Phase 2.
```

Resume pilot consumption only after Fraser approves/provides the published version.

Local work-package stop: Phase 4 Part 2 ends at the shared package publication boundary; Part 3 does not update the pilot until the approved package version is available.

## Part 2 exit gate

- Full protected-signal matrix passes for the pilot stack and shared package.
- No capability was added without a reproducing test.
- Package version is published/approved if required.
- Default and rollback config are documented.
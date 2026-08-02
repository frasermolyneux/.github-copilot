# Phase 1 Part 1 Implementation Evidence

## Baseline gate

Status: **passed**

- Query window: `2026-07-28T00:00:00Z` inclusive to `2026-08-01T00:00:00Z` exclusive.
- Window length: four complete UTC days.
- Phase 0 availability implementation commit: `c53ee85` on 27 July 2026.
- Workspace: `log-platform-monitoring-prd-uksouth`.
- Query mode: read-only, aggregate-only, with explicit KQL and API time boundaries.
- Sensitive values: no URLs, query strings, tokens, response bodies, connection strings, or raw messages were projected.

### Routine lifecycle traces

The Functions host relays the worker's HTTP lifecycle records under `Function.ExternalHealthCheck.User`. It retains the stable `IHttpClientFactory` event names but does not retain the original named-client category or message template in the high-volume rows.

| Event name             | Source category verified locally                                      | Four-day rows |
| ---------------------- | --------------------------------------------------------------------- | ------------: |
| `RequestPipelineStart` | `System.Net.Http.HttpClient.SiteWatch.LogicalHandler`                 |       336,420 |
| `RequestStart`         | `System.Net.Http.HttpClient.SiteWatch.ClientHandler`                  |       336,420 |
| `RequestEnd`           | `System.Net.Http.HttpClient.SiteWatch.ClientHandler`                  |       335,865 |
| `RequestPipelineEnd`   | `System.Net.Http.HttpClient.SiteWatch.LogicalHandler`                 |       335,865 |
| **Total**              |                                                                       |     1,344,570 |

| Day (UTC)  | Routine rows | Routine GiB |
| ---------- | -----------: | ----------: |
| 2026-07-28 |      335,514 |    0.308803 |
| 2026-07-29 |      335,492 |    0.308779 |
| 2026-07-30 |      338,024 |    0.311104 |
| 2026-07-31 |      335,540 |    0.308829 |

- Four-day routine volume: 1.237514 GiB.
- Average routine volume: approximately 0.309379 GiB/day and 336,143 rows/day.
- Total regional SiteWatch `AppTraces`: 1,733,321 rows and 1.612030 GiB.
- Production template hashes are unavailable because the Functions host relay does not preserve `OriginalFormat` on these rows. The local characterization test is therefore the required fixture for category/template provenance and locks the four event names to the two named-client categories before the filter is applied.

### Protected signals

| Signal                                      | Four-day result |
| ------------------------------------------- | --------------: |
| Retry warnings                              |             597 |
| Availability terminal errors                |             113 |
| HTTP terminal errors                        |              39 |
| Exceptions                                  |             571 |
| HTTP dependency spans                       |         219,129 |
| Failed HTTP dependency spans                |               7 |
| Native availability results                 |         448,798 |
| Failed native availability results          |             144 |

Dependency duration remained populated throughout the window:

| Day (UTC)  | Dependencies | Failed | p50 ms  | p95 ms  | p99 ms  |
| ---------- | -----------: | -----: | ------: | ------: | ------: |
| 2026-07-28 |       54,914 |      2 | 141.317 | 438.008 | 814.396 |
| 2026-07-29 |       54,756 |      1 | 143.789 | 446.788 | 857.411 |
| 2026-07-30 |       54,741 |      1 | 141.727 | 436.697 | 787.008 |
| 2026-07-31 |       54,718 |      3 | 149.877 | 475.630 | 929.593 |

Native availability was current in every expected destination:

| Destination                                    | Results | Successful | Failed | Locations | Components |
| ---------------------------------------------- | ------: | ---------: | -----: | --------: | ---------: |
| `ai-geo-location-prd-swedencentral`            |  69,044 |     69,044 |      0 |         3 |          2 |
| `ai-platform-sitewatch-func-prd-eastus`        |  57,535 |     57,504 |     31 |         1 |          5 |
| `ai-platform-sitewatch-func-prd-uksouth`       |  57,549 |     57,518 |     31 |         1 |          5 |
| `ai-platform-sitewatch-func-prd-westeurope`    |  57,531 |     57,500 |     31 |         1 |          5 |
| `ai-portal-core-prd-uksouth`                   | 207,139 |    207,088 |     51 |         3 |          6 |

## Implementation decision

Apply a worker-side `Microsoft.Extensions.Logging` prefix filter at `Warning` for only:

```text
System.Net.Http.HttpClient.SiteWatch.
```

The filter is configured in SiteWatch code because the deployed Function Apps run on Linux and environment-variable log-level overrides cannot reliably address category names containing periods. `host.json` is not used because it controls the separate Functions host pipeline.

The implementation does not change:

- `MX.Platform.SiteWatch.App.ExternalHealthCheck` logging.
- Retry or terminal-failure severity.
- `AddHttpClientInstrumentation()` or dependency spans.
- Native availability emission or routing.
- The shared OpenTelemetry package or its audit-event bypass.
- Terraform, Function app settings, cadence, or regional coverage.

## Local protected-signal tests

- The unfiltered real named client emits the expected four lifecycle event names from the logical and transport handler categories.
- The filter rejects Information lifecycle records from both named-client categories.
- Warning and Error records from those categories are retained.
- `ExternalHealthCheck`, unrelated Function worker, and unrelated application categories are unchanged.
- Successful and failed HTTP client activities reach the tracing processor/exporter with response status and non-zero duration.

## Rollback

Remove the `ConfigureLogging(SiteWatchHttpClient.ConfigureLogging)` registration and redeploy through the normal workflow. This restores the prior Information-level lifecycle logging behavior.

No package downgrade, Terraform reversal, app-setting change, availability change, or credential operation is required.

## Part 2 handoff

Production deployment completed successfully on 1 August 2026 while the governing Phase 0 gate was still open. Read-only immediate validation and equal-window post-change measurement continue in [Part 2](part-2-rollout-and-measurement.md), with results recorded in the [Part 2 implementation evidence](part-2-implementation-evidence.md). Further deployment, controlled dev failure, the Part 2 exit, and later phases are blocked until Phase 0 Part 2 passes or the governing gate is formally changed with an approved rationale.
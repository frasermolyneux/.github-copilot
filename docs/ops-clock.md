# Ops Clock — Weekly Scheduling Strategy

This document defines the weekly operations schedule for all automated workflows across the frasermolyneux organisation. The goal is to prevent resource contention, respect infrastructure dependency ordering, and provide clear maintenance windows.

## Principles

1. **Stagger, don't stack** — workflows sharing infrastructure (e.g. a common App Service Plan) must never run concurrently. Stagger by at least 1 hour for deployments, 5 minutes for teardowns, and 15 minutes for lightweight scans.
2. **Respect the dependency tree** — deploy infrastructure foundations before consumers. For example, `platform-hosting` before `geo-location`, or `portal-environments` before `portal-core` before other portal repos.
3. **Drift prevention is prd-only** — scheduled `deploy-prd` runs exist to detect configuration drift against production. Dev jobs are skipped on schedule using the "Option 1" guard pattern (see [deploy-prd instructions](../.github/instructions/workflows.deploy-prd.instructions.md)).
4. **Group by blast radius** — repos that share infrastructure deploy on the same day so failures are contained within a single maintenance window.
5. **Leave buffer days** — Tuesday and Saturday are intentionally clear for ad-hoc work and incident response.

## Weekly Timetable (all times UTC)

### Daily

| Time | Workflow | Repos |
|------|----------|-------|
| 03:30 | estate-sync | `.github` (org-level) |
| 23:00–23:50 | destroy-development | 11 repos (staggered every 5 min) |

### Sunday — Dependabot (all repos)

All 29 repositories run Dependabot on Sunday, staggered every 15 minutes from 01:00 to 08:00. Each repo's Dependabot time matches its Monday codequality time. All ecosystems use `groups` with `patterns: ["*"]` to batch updates into a single PR per ecosystem.

### Monday — Code Quality (all repos)

All 29 repositories run codequality scans on Monday, staggered every 15 minutes from 01:00 to 08:00. Times match the Sunday Dependabot schedule per repo.

### Tuesday — Clear

No scheduled activity. Buffer day for ad-hoc work.

### Wednesday — Deploy PRD: Portal Stack

The 9 portal repositories deploy to production in dependency order, staggered 1 hour apart from 01:00 to 09:00:

| Time | Repo | Type |
|------|------|------|
| 01:00 | portal-environments | Terraform only |
| 02:00 | portal-core | Terraform only |
| 03:00 | portal-repository | Full pipeline |
| 04:00 | portal-repository-func | Full pipeline |
| 05:00 | portal-event-ingest | Full pipeline |
| 06:00 | portal-servers-integration | Full pipeline |
| 07:00 | portal-sync | Full pipeline |
| 08:00 | portal-bots | Terraform only |
| 09:00 | portal-web | Full pipeline |

### Thursday — Deploy PRD: Shared App Service Plan Stack

Repos sharing the `platform-hosting` App Service Plan deploy in dependency order:

| Time | Repo | Role |
|------|------|------|
| 01:00 | platform-hosting | Infra (plan owner) |
| 02:00 | geo-location | Consumer |
| 03:00 | travel-itinerary | Consumer |
| 04:00 | talkwithtiles | Consumer |

### Friday — Deploy PRD: Independent Repos

Repos with no shared infrastructure dependencies, staggered 1 hour apart:

| Time | Repo |
|------|------|
| 01:00 | molyneux-me |
| 02:00 | platform-connectivity |
| 03:00 | platform-monitoring |
| 04:00 | platform-registry |
| 05:00 | platform-sitewatch-func |
| 06:00 | platform-workloads |
| 07:00 | twenty-one |

### Saturday — Clear

No scheduled activity. Buffer day.

## Scheduling Rules for New Workflows

When adding or modifying scheduled workflows:

1. **Consult this document first** — never assign a cron schedule without checking for conflicts.
2. **deploy-prd** — assign to the correct day (Wed/Thu/Fri) based on infrastructure group. Find the next available hourly slot within that day's window.
3. **codequality** — assign the next available 15-minute slot on Monday (01:00–08:00). Update Dependabot to use the same time on Sunday.
4. **destroy-development** — assign the next available 5-minute slot after 23:00.
5. **Update this document** after changing any schedule.

## Destroy-Development Schedule (Daily 23:00–23:50)

| Time | Repo |
|------|------|
| 23:00 | portal-event-ingest |
| 23:05 | portal-repository |
| 23:10 | portal-repository-func |
| 23:15 | portal-servers-integration |
| 23:20 | portal-sync |
| 23:25 | geo-location |
| 23:30 | talkwithtiles |
| 23:35 | travel-itinerary |
| 23:40 | molyneux-me |
| 23:45 | platform-sitewatch-func |
| 23:50 | twenty-one |

## Codequality & Dependabot Schedule (Monday / Sunday)

| Time | Repo |
|------|------|
| 01:00 | portal-environments |
| 01:15 | portal-core |
| 01:30 | portal-repository |
| 01:45 | portal-repository-func |
| 02:00 | portal-event-ingest |
| 02:15 | portal-servers-integration |
| 02:30 | portal-sync |
| 02:45 | portal-bots |
| 03:00 | portal-web |
| 03:15 | platform-hosting |
| 03:30 | geo-location |
| 03:45 | travel-itinerary |
| 04:00 | talkwithtiles |
| 04:15 | platform-connectivity |
| 04:30 | platform-landing-zones |
| 04:45 | platform-monitoring |
| 05:00 | platform-registry |
| 05:15 | platform-sitewatch-func |
| 05:30 | platform-workloads |
| 05:45 | platform-letsencrypt-iis |
| 06:00 | api-client-abstractions |
| 06:15 | invision-api-client |
| 06:30 | cod-demo-reader |
| 06:45 | bicep-modules |
| 07:00 | ado-pipeline-templates |
| 07:15 | demo-manager |
| 07:30 | molyneux-me |
| 07:45 | twenty-one |
| 08:00 | actions |

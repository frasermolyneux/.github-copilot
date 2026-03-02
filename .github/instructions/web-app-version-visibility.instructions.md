---
description: These instructions define the standard pattern for web app version visibility including the /info endpoint, footer version display, and deployment verification polling. AI should follow these patterns when generating, reviewing, or modifying web app projects and their deployment workflows.
applyTo: '**/InfoEndpointExtensions.cs,**/deploy-dev.yml,**/deploy-prd.yml,**/_Layout.cshtml'
---

# Web App Version Visibility

Refer to `docs/web-app-version-visibility.md` in the `.github-copilot` repository for the full specification.

## Key Rules

- Every web app must have `version.json` in the repo root and `Nerdbank.GitVersioning` in `Directory.Build.props`.
- Every web app must expose a `/info` endpoint via `InfoEndpointExtensions.cs` calling `app.MapInfoEndpoint()` in `Program.cs`. The endpoint must be `AllowAnonymous`.
- The `/info` endpoint returns `{ version, buildVersion, assemblyVersion }` using `Assembly.GetExecutingAssembly()` reflection.
- The layout footer must display the build version with a hover tooltip showing the full informational version and assembly version. Use `@(buildVersion)` Razor syntax (with parentheses) when adjacent to literal text.
- The `_ViewImports.cshtml` must include `@using System.Reflection`.
- The `build-and-test` workflow job must expose `build_version` as an output from the `dotnet-web-ci` step.
- Deploy steps must be named with the version: `name: Deploy v${{ needs.build-and-test.outputs.build_version }}`.
- After every `deploy-app-service` step (both dev and prd), call `frasermolyneux/actions/wait-for-version@wait-for-version/v1.0` with `info-url` and `expected-version`.
- API projects use the same `wait-for-version` action but with their versioned info path (e.g. `/v1.0/info`).

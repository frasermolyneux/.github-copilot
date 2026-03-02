# Web App Version Visibility

This document describes the standard approach for versioning ASP.NET Core web applications, exposing version information at runtime, and verifying deployments in CI/CD workflows.

## Overview

Every web application in the organisation should:

1. **Embed a git-derived version** into the assembly at build time using Nerdbank.GitVersioning
2. **Expose a `/info` endpoint** returning version metadata as JSON (anonymous, no auth required)
3. **Display the version in the site footer** with additional detail on hover
4. **Verify the deployment** by polling `/info` until the expected version is confirmed live

This mirrors the existing pattern used by API projects (which expose `/v1.0/info` via `ApiInfoController`) but adapted for web frontends using minimal APIs and layout-level rendering.

## Components

### Nerdbank.GitVersioning

Every repo must have a `version.json` in the repository root and a `Nerdbank.GitVersioning` package reference in `Directory.Build.props`.

**`version.json`:**

```json
{
    "$schema": "https://raw.githubusercontent.com/dotnet/Nerdbank.GitVersioning/main/src/NerdBank.GitVersioning/version.schema.json",
    "version": "1.0",
    "gitTagVersionPrefix": "v",
    "publicReleaseRefSpec": [
        "^refs/heads/main$",
        "^refs/tags/v\\d+\\.\\d+\\.\\d+$"
    ],
    "prerelease": {
        "version": "preview",
        "precision": "build"
    },
    "cloudBuild": {
        "setVersionVariables": true,
        "buildNumber": {
            "enabled": true
        }
    }
}
```

**`Directory.Build.props`** (add to existing or create):

```xml
<ItemGroup>
  <PackageReference Include="Nerdbank.GitVersioning" Version="3.9.50" PrivateAssets="all" />
</ItemGroup>
```

If `LangVersion` is defined in the `.csproj`, move it to `Directory.Build.props` to avoid duplication.

The `dotnet-web-ci` shared action already runs `nbgv-metadata` and outputs `build_version` — no workflow changes needed for the build step itself.

### `/info` Endpoint

Each web project must include an `InfoEndpointExtensions.cs` file that registers an anonymous minimal API endpoint at `/info`.

**`InfoEndpointExtensions.cs`:**

```csharp
using System.Reflection;

namespace <ProjectRootNamespace>;

public static class InfoEndpointExtensions
{
    public static WebApplication MapInfoEndpoint(this WebApplication app)
    {
        app.MapGet("/info", () =>
        {
            var assembly = Assembly.GetExecutingAssembly();
            var informationalVersion = assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
                .InformationalVersion ?? "unknown";
            var assemblyVersion = assembly.GetName().Version?.ToString() ?? "unknown";

            return Results.Ok(new
            {
                Version = informationalVersion,
                BuildVersion = informationalVersion.Split('+')[0],
                AssemblyVersion = assemblyVersion
            });
        }).AllowAnonymous();

        return app;
    }
}
```

**`Program.cs`** — add the using and call after route mapping:

```csharp
using <ProjectRootNamespace>;

// ... after MapRazorPages() / MapControllers()
app.MapInfoEndpoint();
```

The endpoint returns:

```json
{
  "version": "1.0.42+a1b2c3d",
  "buildVersion": "1.0.42",
  "assemblyVersion": "1.0.0.0"
}
```

- `version` — full informational version including git metadata
- `buildVersion` — clean semantic version (used for workflow polling)
- `assemblyVersion` — .NET assembly version

The endpoint must be `AllowAnonymous` so the GitHub Actions runner can poll it without authentication.

### Footer Version Display

Add a version indicator to the site footer in the layout file. The build version is shown as text, with the full informational version and assembly version available on hover via a `title` attribute.

**`_ViewImports.cshtml`** — add the using:

```razor
@using System.Reflection
```

**MVC / Razor Pages (`_Layout.cshtml`):**

Add a Razor code block before the `<footer>` to compute the values once:

```razor
@{
    var entryAssembly = System.Reflection.Assembly.GetEntryAssembly();
    var informationalVersion = entryAssembly?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "unknown";
    var buildVersion = informationalVersion.Split('+')[0];
    var assemblyVersion = entryAssembly?.GetName().Version?.ToString() ?? "unknown";
}
<footer>
    <!-- existing footer content -->
    <span class="float-end small" title="Full: @informationalVersion&#10;Assembly: @assemblyVersion">v@(buildVersion)</span>
</footer>
```

Key Razor syntax notes:
- Use `@(buildVersion)` (with parentheses) when the variable is adjacent to literal text like `v` — plain `@buildVersion` will not parse correctly
- Use `&#10;` for a line break in the HTML `title` attribute so the hover tooltip shows values on separate lines

**Blazor (`MainLayout.razor`):**

Use a `@code` block to compute the values and render similarly in the layout markup.

### Deployment Verification

Workflows must verify that the newly deployed version is actually running before proceeding to downstream steps (integration tests, production gates, etc.).

#### Build version output

The `build-and-test` job must expose `build_version` as a job output. The `dotnet-web-ci` action already computes this via `nbgv-metadata` — it just needs to be wired through:

```yaml
build-and-test:
  outputs:
    build_version: ${{ steps.web-ci.outputs.build_version }}
  steps:
    - id: web-ci
      uses: frasermolyneux/actions/dotnet-web-ci@dotnet-web-ci/v1.4
      with:
        dotnet-project: "<ProjectName>"
        ...
```

#### Deploy step naming

Name the deploy step with the version so it is visible in the GitHub Actions sidebar:

```yaml
- name: Deploy v${{ needs.build-and-test.outputs.build_version }}
  uses: frasermolyneux/actions/deploy-app-service@deploy-app-service/v1.2
  with:
    ...
```

#### Version polling

After each deploy step, use the shared `wait-for-version` action to poll the `/info` endpoint:

```yaml
- uses: frasermolyneux/actions/wait-for-version@wait-for-version/v1.0
  with:
    info-url: "https://${{ needs.terraform-plan-and-apply.outputs.web_app_name }}.azurewebsites.net/info"
    expected-version: ${{ needs.build-and-test.outputs.build_version }}
```

The action:
- Polls the `info-url` up to 30 times (configurable via `max-attempts`) with 10-second intervals (configurable via `delay-seconds`)
- Extracts `.buildVersion` from the JSON response using `jq`
- Exits successfully when the expected version is confirmed
- Writes a ✅ or ❌ job summary table with version, URL, and attempt count
- Fails the workflow if the version is not confirmed within the timeout

This must be added after **every** `deploy-app-service` step — both dev and prd environments.

#### API projects

API projects can also adopt the `wait-for-version` action to replace their existing inline polling scripts. The only difference is the URL path (e.g. `/v1.0/info` instead of `/info`):

```yaml
- uses: frasermolyneux/actions/wait-for-version@wait-for-version/v1.0
  with:
    info-url: "https://${{ needs.terraform.outputs.api_app_name }}.azurewebsites.net/v1.0/info"
    expected-version: ${{ needs.build-and-test.outputs.build_version }}
```

## Implementation Checklist

When adding version visibility to a web project, verify each item:

1. **`version.json` exists** in the repository root with the standard schema
2. **`Directory.Build.props`** includes `Nerdbank.GitVersioning` with `PrivateAssets="all"`
3. **`LangVersion` not duplicated** — defined in `Directory.Build.props`, not in `.csproj`
4. **`InfoEndpointExtensions.cs` exists** in the web project with correct namespace
5. **`Program.cs` calls `app.MapInfoEndpoint()`** after route mapping
6. **`_ViewImports.cshtml`** includes `@using System.Reflection`
7. **Layout footer** displays version with hover tooltip using `@(buildVersion)` syntax
8. **`build-and-test` job** has `outputs: build_version` wired from the `dotnet-web-ci` step
9. **Deploy steps** are named with `Deploy v${{ ... }}` for log visibility
10. **`wait-for-version` action** is called after every `deploy-app-service` step in both dev and prd workflows

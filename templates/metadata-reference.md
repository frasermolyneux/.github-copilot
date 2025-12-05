# Repository Metadata Template

Use this document as the canonical source for aligning repository metadata. Adapt project-specific names, URLs, and commands, but preserve the section order and tone.

## README Outline
1. `# Project Name` followed by a one-line tagline.
2. **Workflows**: badge block referencing CI, preview, publish, and validation pipelines.
3. **Overview**: two short paragraphs describing what the project delivers and where documentation lives.
4. **Technology & Frameworks**: bullet list of runtimes, SDKs, and key NuGet/npm packages.
5. **Documentation Index**: list of Markdown links under `docs/` that explain architecture, consumer/provider guidance, versioning, and maintenance.
6. **Getting Started**: shell snippet covering clone, build, and test commands (include both unit and integration test filters).
7. **Contributing**, **Security**, and **License** sections that point to the respective files.

## README Sample Snippets
- **Overview Paragraph**: `This repository packages shared abstractions, client libraries, and web extensions so every team can build and consume APIs with identical conventions. Use the docs under \`docs/\` to understand cross-cutting decisions, upgrade flows, and maintenance workflows.`
- **Technology Bullets**:
  - `.NET 9.0 & .NET 10.0 – Multi-targeted across every package`
  - `Azure.Identity 1.17.x – Entra ID authentication and credential orchestration`
  - `RestSharp 113 + Polly 8.6 – Resilient HTTP client pipeline with retries and caching hooks`
  - `ASP.NET Core 9/10 – Consistent controller and HTTP result mapping`
- **Documentation Index Entries** (swap filenames as needed):
  - `[docs/api-design-v2.md](./docs/api-design-v2.md) – Routing, filters, pagination, and response envelope reference.`
  - `[docs/implementing-api-consumer.md](./docs/implementing-api-consumer.md) – End-to-end guidance for resilient API consumers.`
  - `[docs/implementing-api-provider.md](./docs/implementing-api-provider.md) – Controller, response, and error-handling patterns for providers.`
  - `[docs/implementing-versioned-api-client.md](./docs/implementing-versioned-api-client.md) – Structuring multi-version clients with shared options/builders.`
  - `[docs/package-maintenance.md](./docs/package-maintenance.md) – Dependabot flow and manual NuGet update process.`
- **Getting Started Commands**:
  ```pwsh
  git clone <repo-url>
  cd <repo-folder>
  dotnet build src/<solution>.sln
  dotnet test src/<solution>.sln --filter FullyQualifiedName!~IntegrationTests
  dotnet test src/<solution>.sln --filter FullyQualifiedName~IntegrationTests
  ```
- **Contributing blurb**: `Please read the contributing guidance; this project exists to explore new tools and patterns, so direct pull requests are generally not expected but constructive feedback is always welcome.`
- **Security blurb**: `Please read the security policy; report issues to security@mx-mail.io or by opening a GitHub issue.`
- **License blurb**: `Distributed under the GNU General Public License v3.0; see LICENSE for details.`

## CONTRIBUTING Template
```
# CONTRIBUTING

This is a personal project used to learn and apply new tools, technologies, and approaches. Direct contributions are not expected, but constructive feedback, feature requests, and issues are always welcome.
```

## SECURITY Template
```
# Security Policy

## Supported Versions
This is a learning and development project; there is no formal external support.

## Reporting a Vulnerability
Report vulnerabilities to security@mx-mail.io or by opening a GitHub issue. I appreciate responsible disclosure.
```

## LICENSE
Use the exact GPLv3 body stored in `templates/gpl-v3-license.txt`. Do not edit the text; replace the repository's `LICENSE` file wholesale if it drifts.

## Release Notes Snippet
```
## Metadata Updates
- README.md – aligned section order, refreshed badges, updated documentation links.
- CONTRIBUTING.md – synchronized with shared contributing statement.
- SECURITY.md – synchronized contact instructions.
- LICENSE – replaced with canonical GPLv3 text.
```

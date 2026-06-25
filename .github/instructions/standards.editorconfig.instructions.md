---
description: "Use when .editorconfig analyzer and style severity baseline for .NET repositories in the frasermolyneux organization."
applyTo: '**/.editorconfig'
---
# Standard — .NET .editorconfig Baseline

## Purpose

This standard is the companion to `standards.dotnet-project.instructions.md`.

- `Directory.Build.props` defines build behavior (`TreatWarningsAsErrors`, `EnforceCodeStyleInBuild`, `EnableNETAnalyzers`, `AnalysisLevel`, `CodeAnalysisTreatWarningsAsErrors`).
- `.editorconfig` defines diagnostic severities and code style preferences.

Keep both aligned so style and analyzer handling is predictable across local development and CI.

## Baseline severity policy

Repository root `.editorconfig` files should include:

```ini
root = true
```

For C# and VB source files, use this baseline:

```ini
[*.{cs,vb}]
dotnet_analyzer_diagnostic.category-naming.severity = warning
dotnet_analyzer_diagnostic.category-style.severity = warning
dotnet_analyzer_diagnostic.category-maintainability.severity = warning
dotnet_analyzer_diagnostic.category-formatting.severity = warning
dotnet_analyzer_diagnostic.category-security.severity = warning
dotnet_analyzer_diagnostic.category-performance.severity = warning
dotnet_analyzer_diagnostic.category-reliability.severity = warning
dotnet_analyzer_diagnostic.category-usage.severity = warning

# Lower-noise categories can start at suggestion.
dotnet_analyzer_diagnostic.category-design.severity = suggestion
dotnet_analyzer_diagnostic.category-globalization.severity = suggestion

# C# style baseline.
csharp_using_directive_placement = outside_namespace:warning
csharp_style_var_for_built_in_types = true:warning
csharp_style_var_when_type_is_apparent = true:warning
csharp_style_var_elsewhere = true:warning
csharp_style_namespace_declarations = file_scoped:warning

# .NET style baseline.
dotnet_style_qualification_for_field = false:warning
dotnet_style_qualification_for_property = false:warning
dotnet_style_qualification_for_method = false:warning
dotnet_style_qualification_for_event = false:warning
dotnet_diagnostic.IDE0011.severity = warning
dotnet_style_require_accessibility_modifiers = for_non_interface_members:warning
dotnet_style_object_initializer = true:warning
dotnet_style_collection_initializer = true:warning
dotnet_style_prefer_auto_properties = true:warning
dotnet_style_null_propagation = true:warning
dotnet_style_namespace_match_folder = true:warning
```

Because the org baseline enables `CodeAnalysisTreatWarningsAsErrors`, any analyzer/style rule set to `warning` becomes build-blocking.

## Rule-level exceptions

- Avoid downgrading diagnostics below the baseline unless there is a clear, documented reason.
- Any downgrade (for example `warning` to `suggestion`, `silent`, or `none`) must include an inline comment explaining why.
- For temporary relaxations, a tracking issue reference in the comment is recommended.
- Prefer targeted per-rule overrides over broad category downgrades.

Example:

```ini
dotnet_diagnostic.IDE0060.severity = none # Intentional for framework callback signatures; tracked in #1234
```

## Common test naming exception (optional)

Many repositories in this org use underscore-separated xUnit method names for readability (for example `Method_Condition_ExpectedResult`). That pattern can conflict with `CA1707`.

When a repository predominantly uses underscore-style test names, a targeted exception is allowed:

```ini
[**/*Tests.cs]
# Keep descriptive xUnit method names with underscores for readability in test code.
dotnet_diagnostic.CA1707.severity = none
```

- Keep this exception scoped to test files only.
- Keep the inline rationale comment.
- Do not disable `CA1707` globally.

## Generated code

Disable style/analyzer noise for generated files only, not for hand-written code.

Generated-file blanket disables are an allowed exception to the inline-comment rule above.

```ini
[*.g.cs]
dotnet_analyzer_diagnostic.severity = none

[*.Designer.cs]
dotnet_analyzer_diagnostic.severity = none

[*.generated.cs]
dotnet_analyzer_diagnostic.severity = none

[*.AssemblyInfo.cs]
dotnet_analyzer_diagnostic.severity = none
```

## Compliance

- A repository-root `.editorconfig` exists in SDK-style .NET repositories and sets `root = true`.
- Category severity baseline matches this standard unless a documented exception exists.
- Rule-level severity downgrades below baseline include an inline justification comment.
- If `CA1707` is downgraded for test naming, it is scoped to test files only and includes an inline rationale comment.
- `.editorconfig` severity choices remain aligned with the warning-as-error baseline in `Directory.Build.props`.
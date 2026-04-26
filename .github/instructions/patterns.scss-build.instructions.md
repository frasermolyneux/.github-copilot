---
description: SCSS build pattern (npm-driven Sass compile alongside .NET projects).
applyTo: '**/package.json,**/*.scss,**/*.sass'
---
# Pattern — SCSS Build

A small number of .NET web projects (notably `portal-web`) ship custom CSS compiled from SCSS. The build is owned by **npm**, lives **inside** the .NET project folder, and runs **alongside** the .NET build — not as a separate publishable artefact.

## Layout

```
src/<WebProject>/
├── <WebProject>.csproj
├── package.json          ← npm-managed Sass tooling
├── package-lock.json     ← committed
├── Styles/               ← .scss source
│   ├── site.scss
│   └── _variables.scss
└── wwwroot/css/          ← compiled output, served at runtime
    └── site.css
```

## package.json shape

```json
{
  "private": true,
  "scripts": {
    "build:css": "sass --no-source-map Styles/site.scss wwwroot/css/site.css --style=compressed",
    "watch:css": "sass --watch Styles/site.scss wwwroot/css/site.css"
  },
  "devDependencies": {
    "sass": "^1.<x>"
  }
}
```

- `private: true` — never published to npm.
- Compiled CSS is **committed** so that `dotnet build` works without npm. CI re-runs `npm run build:css` and verifies the working tree is clean (no drift).

## Local workflow

```bash
cd src/<WebProject>
npm install
npm run build:css        # one-off compile
npm run watch:css        # live editing during development
```

## CI workflow

The build-and-test workflow runs:

1. `npm ci` (in the project folder)
2. `npm run build:css`
3. `git diff --exit-code wwwroot/css/` — fails the build if compiled CSS drifted from source.
4. Continue with `dotnet build` / `dotnet test`.

This is wired up in the consumer repo's `.github/workflows/build-and-test.yml` — there is **no shared composite** for SCSS at present (consumer count is too small to justify one).

## Why this layout

- Keeps SCSS sources colocated with the project that owns them.
- Avoids introducing a separate npm publish artefact pipeline.
- Compiled CSS in source means the .NET build stays single-step for downstream consumers.

## Compliance

- `package.json` is `private: true` and lives in the project folder.
- `package-lock.json` is committed.
- Compiled `.css` output is committed and matches a fresh `npm run build:css`.
- CI runs `npm ci && npm run build:css` and verifies no drift.

## Cross-references

- `standards.dotnet-project.instructions.md` — surrounding .NET project conventions
- `workflows.build-and-test.instructions.md` — where npm steps are wired into CI

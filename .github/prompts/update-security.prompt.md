---
name: update-security
description: Generate or update `SECURITY.md` with security policies and guidelines for the project
---
Before updating the security file, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Update or create `SECURITY.md` for this project with the following verbatim content:

```markdown
# Security Policy

## Supported Versions

This is a learning and development project, as such there is no direct support given for external users.

## Reporting a Vulnerability

I encourage any and all security vulnerabilities to be reported to `security@mx-mail.io` or by opening an issue through GitHub.
```

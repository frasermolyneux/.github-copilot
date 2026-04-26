---
description: Mandatory authentication rules — OIDC federation only, managed identities preferred, no client secrets.
applyTo: '**/*.tf,.github/workflows/**/*.yml,**/azure-pipelines*.yml'
---
# Standard — OIDC and Secrets

## No client secrets

Client secrets and certificate-based AAD app credentials are **prohibited** for any new workload. Existing client secrets are technical debt to be removed.

## OIDC federation everywhere

GitHub Actions and Azure DevOps authenticate to Azure exclusively via **OIDC federated credentials** on AAD app registrations provisioned by `platform-workloads`.

### GitHub Actions

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: azure/login@v3
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

The `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` repo/environment secrets are injected automatically by `platform-workloads` provisioning. Do not create these manually.

### Azure DevOps

Use a service connection of type **Azure Resource Manager — Workload identity federation** (provisioned by `platform-workloads`). Pipelines reference it by name:

```yaml
- task: AzureCLI@2
  inputs:
    azureSubscription: '<service-connection-name>'
    # ...
```

## Managed identity preference

For Azure-internal authentication (e.g. App Service → Key Vault, Function → Storage), prefer managed identities in this order:

1. **System-assigned managed identity** on the calling resource.
2. **User-assigned managed identity** when the same identity is shared across resources.
3. Workload-identity-federated AAD app — only when the caller is non-Azure.

## Compliance

A workflow / pipeline is compliant when:

- It declares `permissions: id-token: write` (GitHub) or uses a federated service connection (ADO).
- It does not reference any `*_CLIENT_SECRET`, `*_PASSWORD`, or `AZURE_CREDENTIALS` JSON-blob secret.
- It uses `azure/login@v3` (GitHub) without `creds:` input.

A Terraform stack is compliant when:

- AAD apps it creates do not have `azuread_application_password` resources.
- Azure resources that need to authenticate to other Azure resources have `identity { type = "SystemAssigned" }` (or user-assigned) blocks rather than connection strings with embedded keys.

## Cross-references

- `tenant.identity.instructions.md` — identity model and federated-subject formats
- `platform.workloads.instructions.md` — how identities and federations are provisioned
- `patterns.workload-identity-provisioning.instructions.md` — end-to-end flow

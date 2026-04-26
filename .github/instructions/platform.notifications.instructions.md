---
description: Consumption contract for platform-notifications — centralised email/SMS notification API.
applyTo: '**/*.tf,**/*.tfvars,**/appsettings*.json,**/*.cs'
---
# platform-notifications — Consumer Contract

Centralised email (and SMS-capable) notification service backed by **Azure Communication Services**, fronted by **APIM** with Entra ID authorisation. Messages flow through Service Bus for resilient delivery.

## What it provides

- Azure Communication Services (Email + SMS capable)
- Email Communication Service with Azure-managed domain (dev/prd fallback) and custom domains (prd only)
- Function App (Flex Consumption, .NET 9, Linux) handling the queue
- Service Bus namespace + queues for message resilience
- API Management (Consumption tier) with Entra ID app role authorisation
- Key Vault for secrets, Storage Account for Function App artefacts
- Application Insights publishing to platform-monitoring's central Log Analytics
- Entra ID application with **domain-scoped app roles** (`{domain}.email.sender`)

## Terraform outputs

| Output | Shape |
|---|---|
| `resource_group_name` | string |
| `function_app_name` | string |
| `api_management_name` | string |
| `entra_api_application_client_id` | string |
| `key_vault_name` | string |
| `storage_account_name` | string |

## State backend

| Env | Resource Group | Storage Account |
|---|---|---|
| dev | `rg-tf-platform-notifications-dev-uksouth-01` | `sa223d7b247273` |
| prd | `rg-tf-platform-notifications-prd-uksouth-01` | `sa201888bc88bd` |

Container `tfstate`, key `terraform.tfstate`, subscription `7760848c-794d-4a19-8cb2-52f71a21ac2b`.

## Consumer wiring (.NET — preferred)

Consumers integrate via the published NuGet client, not by calling APIM directly:

```csharp
// Program.cs
services.AddNotificationsApiClient(options => options
    .WithBaseUrl(Configuration["Notifications:BaseUrl"])
    .WithEntraIdAuthentication(Configuration["Notifications:Resource"]));
```

`appsettings.json`:

```json
{
  "Notifications": {
    "BaseUrl": "https://apim-platform-notifications-prd-uksouth.azure-api.net/notifications",
    "Resource": "api://e56a6947-bb9a-4a6e-846a-1f118d1c3a14/platform-notifications-api-prd"
  }
}
```

Consumer service:

```csharp
public class ReportNotifier(INotificationsApiClient notifications)
{
    public async Task NotifyReadyAsync(string email, string name)
    {
        var result = await notifications.Email.SendEmail(new SendEmailRequestDto
        {
            SenderDomain = "molyneux.io",      // requires {domain}.email.sender app role
            Subject      = "Your report is ready",
            HtmlBody     = $"<p>Hi {name}, your report is ready.</p>",
            PlainTextBody= $"Hi {name}, your report is ready.",
            To           = [new EmailRecipientDto { EmailAddress = email, DisplayName = name }]
        });
        if (!result.IsSuccess) { /* handle */ }
    }
}
```

## NuGet packages

- `MX.Platform.Notifications.Abstractions.V1` — DTOs and interface
- `MX.Platform.Notifications.Api.Client.V1` — concrete client + DI extension
- `MX.Platform.Notifications.Api.Client.Testing` — `FakeNotificationsApiClient` for tests

## Sending domains

Custom sending domains (prd only):

`molyneux.io`, `molyneux.me`, `molyneux.dev`, `xtremeidiots.com`, `geo-location.net`, `craftpledge.org`

Dev environments fall back to the Azure-managed domain (no custom domain required).

## App-role authorisation

Each sending domain has a corresponding Entra ID app role on the notifications API: `{domain}.email.sender` (e.g. `molyneux.io.email.sender`). The consumer's workload identity must hold the role for the domain it sends from.

App-role assignment is configured in the consumer workload's `platform-workloads` JSON (`role_assignments`).

## Special conventions

- **Tenant ID**: `e56a6947-bb9a-4a6e-846a-1f118d1c3a14`
- **APIM identifier-URI pattern**: `api://{tenant_id}/{app_display_name}` (e.g. `api://e56a6947-bb9a-4a6e-846a-1f118d1c3a14/platform-notifications-api-prd`)
- **Message flow**: HTTP → APIM → Function → Service Bus → Email Service → ACS managed/custom domain
- **App Insights sampling**: 25% (dev), 75% (prd); telemetry lands in platform-monitoring's central Log Analytics

## Documentation

- `platform-notifications/docs/architecture.md` — high-level architecture
- `platform-notifications/docs/api-versioning-and-apim.md` — APIM routing and versioning
- `platform-notifications/docs/domain-setup.md` — onboarding a new custom sending domain
- `platform-notifications/README.md` — Quick Start: client registration and usage

## Cross-references

- `patterns.api-client.instructions.md` — typed-client shape
- `patterns.terraform-remote-state.instructions.md` — for Terraform-based consumers needing the APIM/Function names
- `platform.workloads.instructions.md` — app-role assignment via workload JSON

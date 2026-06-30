# Authentication and Trust

How a game server — **outside Azure and untrusted** — authenticates to the portal, and how the blast radius of a compromised server is contained.

## The trust boundary

The plugin runs on a public, internet-exposed game server that operators may not fully control. This is a genuine **third trust boundary**, distinct from the Azure↔Azure boundary the org's "no client secrets" standard governs. A credential on the server is therefore unavoidable. *Ideally* it would be per-server and the server would not declare its own identity — but we consciously accept a **single shared** credential and **self-declared `ServerId`** as a deliberate simplicity trade-off (see below), with per-server containment deferred.

## Credential model: single shared Entra app (accepted risk)

Game servers are **100% DB-driven** — Terraform never enumerates them, so per-server Entra apps or APIM subscriptions (80+) are impractical.

**Decision:** use a **single shared Entra app** per environment (`portal-cod4x-plugin-dev` / `portal-cod4x-plugin-prd`) for all servers, provisioned in Terraform like the existing 4 static apps (`azuread_application` + 30-day-rotating `azuread_application_password`, secret in a namespace Key Vault). Every server's plugin authenticates to APIM with the **same** client-id/secret for its environment. One Terraform block per environment, no per-server provisioning, no Graph-permission sprawl.

**Accepted risk — no per-server identity.** The shared secret is installed on every server, so a leak from **any single box** lets an attacker authenticate as "a game server" and submit events for **any `ServerId`** — forging bans/admin/chat across the fleet. Revocation is **all-or-nothing** (rotate the one app password → every server must receive the new value). A per-server key layer (an `ingest` row in `GameServerConfiguration`, reusing the ftp/rcon pattern) would contain a compromise to one server for near-zero extra complexity, but is **deliberately deferred** in favour of the simplest possible setup. If containment is later needed, add it then — the ingest would stamp `ServerId` from the per-server key instead of trusting the body.

## Storage on the server

- The shared app's **client secret** is stored as a **`CVAR_INIT` secure cvar** (so it never appears in `status` / `cvarlist`) or a restricted-permissions file alongside the plugin, pushed by the [`portal-server-agent`](plugin-installation-and-updates.md).
- The plugin caches the bearer token in memory and refreshes before expiry — never fetch a token per request.
- **Rotation is fleet-wide:** rotate the single app password, then the agent re-pushes the new value to every server.

## Server identity (self-declared — the accepted risk)

With only the shared app, `ServerId`/`GameType` are **self-declared in the event body** and trusted — the shared app authenticates the request as "a game server", not a specific one, so the ingest cannot stamp `ServerId` from the subject. This is the crux of the accepted risk above. The plugin obtains its own `ServerId` and `GameType` from **config injected at install** by the agent (cvars / bootstrap file, alongside the credential) — not discovered at runtime. The remaining mitigations are **rate-limiting per source**, **strict envelope validation**, and **watching for anomalous `ServerId` patterns**. (If blast-radius containment is later required, add the per-server key and stamp `ServerId` from it instead of the body.)

## Hardening the ingest boundary

The APIM ingest front now accepts internet traffic, so:

- **Rate-limit** per server (APIM policy).
- **Validate hard** — reject malformed envelopes, oversized payloads, unknown event types.
- **Treat all fields as hostile** — chat text, player names (strip color codes `\^\d`), etc. Apply the same content-safety posture the existing processors use.
- **HTTPS only** — CoD4x links mbedtls with a CA store, so TLS to APIM is native.

## Org-standard deviation (document it)

Introducing a shared server-side secret is a conscious deviation from the Azure-to-Azure no-secrets rule, justified by the external trust boundary. Record it in the consuming repo's `docs/` and in the workload identity provisioning so reviewers understand why it exists.

## Related

- [Event ingest pipeline](event-ingest-pipeline.md) — what the authenticated request carries.
- [Plugin installation and updates](plugin-installation-and-updates.md) — who provisions/rotates the credential.
- [Risks and open questions](risks-and-open-questions.md) — credential rotation and ingest-surface risks.

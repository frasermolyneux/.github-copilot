# Feature Catalogue

The estate's functionality is grouped into **feature modules**, each a self-contained repository. Boundaries follow the domain nouns and the settings namespaces that already exist in the code.

## Grouping rules

1. **Cohesion by domain noun** (Maps, Bans, Players…), not by plane. A feature owns *all* its planes.
2. **Follow the settings namespace** where one exists — it is the strongest boundary signal.
3. **Cross-cutting infrastructure stays in core/SDK,** not in a feature (auth, live-status transport, event bus wiring, the API clients).
4. **A feature may span planes but must not span domains.** Two things that always change together are one feature.

## Platform / core (stays central — not a feature)

| Concern                           | Home                                                                  | Notes                                                                                                                                                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data plane                        | `portal-repository`                                                   | System of record behind APIM. Unchanged.                                                                                                                                                                                                                                   |
| Feature SDK                       | `portal-feature-sdk`                                                  | 2 SDK packages (`FeatureSdk` + `FeatureSdk.Web`) + `.Testing`.                                                                                                                                                                                                             |
| Event transport                   | `portal-server-events` host + `portal-server-agent`                   | Bus wiring, queue naming, the dispatcher. Producer unchanged.                                                                                                                                                                                                              |
| Live status / server monitoring   | core service consumed by features                                     | Many features read "current map/players". The LiveStatus store + `ServerStatusProcessor` stay central, exposed through `IServerEventContext`.                                                                                                                              |
| Player tag substrate              | core `IPlayerTagService` + reset orchestration                        | Registry + assign/read + the system-tag **reset**. Many features depend on tags (moderation reads `ModerateChatTag`, VPN writes tags); features contribute their tag definitions + reconcilers. See [Player tags plane](architecture.md#player-tags-plane-core-substrate). |
| RCON / query gateway              | `portal-servers-integration`                                          | Stays an API; exposed to features via `IRconGateway`.                                                                                                                                                                                                                      |
| Auth / identity / policies        | `portal-web` core                                                     | Policy *registration* stays central; features *declare* the policies they need via the Web SDK.                                                                                                                                                                            |
| Geo / IP intelligence             | `geo-location`                                                        | External dependency; consumed by AutoAdmin and shared platform GeoIP enrichment.                                                                                                                                                                                           |
| Cross-cutting settings namespaces | `Shared`, `Agent`, `ServerList` (+ `rcon`, `fileTransport`, `events`) | Platform-owned; contracts live in the platform `Settings.Contracts.V1` package.                                                                                                                                                                                            |

## Feature modules

Each row is a repository publishing the plane packages marked ✓. **A** = `.Abstractions`, **W** = `.Web`, **E** = server-events, **J** = jobs. **E** and **J** ship together in one `.Processing` package.

| Feature module                        |   A   |   W   |   E   |   J   | Consolidates                                                                                                                                                                                                           |
| ------------------------------------- | :---: | :---: | :---: | :---: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maps**                              |   ✓   |   ✓   |   ✓   |   ✓   | Maps/MapManager/MapRotations controllers, map-vote commands, MapImage/MapRedirect/RotationCleanup sync, MapPopularity rebuild, SI map FTP sync                                                                         |
| **Bans & Ban Files**                  |   ✓   |   ✓   |   ✓   |   ✓   | BanFileMonitors UI, ban processors, BanFileMonitor import, agent ban-file push, `banfiles` settings                                                                                                                    |
| **Chat Commands**                     |   ✓   |   ✓   |   ✓   |       | the whole `Commands/*` framework + built-in commands, `chatCommands` settings                                                                                                                                          |
| **AutoAdmin** (automated enforcement) |   ✓   |   ✓   |   ✓   |   ✓   | VPN/Proxy Protection (`VpnProtection/*` + geo risk), Chat Moderation (`Moderation/*` + Content Safety), Protected Names, and the **VPN-detected-tags reconcile**. Owns `vpnProtection` + `moderation` settings.        |
| **Welcome Messages**                  |   ✓   |   ✓   |   ✓   |       | `Commands/WelcomeMessage*`, `welcomeMessages` settings                                                                                                                                                                 |
| **Player Tags**                       |   ✓   |   ✓   |       |   ✓   | PlayerTags/Tags controllers + block (the tag **management UI**) and the connected-player reconcile. The tag **substrate** (registry/assign/read + the reset) is **core**; the VPN-detected reconcile is **AutoAdmin**. |
| **Admin Actions**                     |   ✓   |   ✓   |       |   ✓   | AdminActions controller + block, forum topic integration, UnclaimedActionReminder                                                                                                                                      |
| **Demos**                             |   ✓   |   ✓   |       |       | DemosController + `IDemoManager`; wraps `cod-demo-reader`                                                                                                                                                              |
| **Broadcasts**                        |   ✓   |   ✓   |   ✓   |       | `broadcasts` settings + enforcement                                                                                                                                                                                    |
| **Analytics / Stats**                 |   ✓   |   ✓   |       |       | AnalyticsController, stats snapshots read model                                                                                                                                                                        |
| **Server Integration Config**         |   ✓   |   ✓   |   ✓   |       | `Screenshots`, `Cod4xPlugin`, `Cod4xPower`, `Cod4xCommands` — one feature. `ServerList` is platform-owned, not part of this.                                                                                           |

**Grouping notes:**

- **AutoAdmin** groups VPN Protection, Chat Moderation, and Protected Names because they share one pattern (react → evaluate server/game policy → RCON enforce) — the operator's "server guard rails". It owns the `vpnProtection` and `moderation` settings namespaces plus protected-names data, each a distinct settings section. **VPN Protection and Protected Names are connection *collaborators*** (`IConnectionGuard` / `IProtectedNameEnforcer`) on the platform-owned `PlayerConnected` / `PlayerIpResolved` core orchestration — **not** independent pipeline handlers (decision 17); the guard also writes the **VPN-detected tag in real time** on connect/ip-resolved, with the daily `ReconcileVpnDetectedTags` job as the backstop. **Chat Moderation** *is* an independent `IServerEventHandler<ChatMessageEvent>`. Chat Commands and Welcome Messages stay **separate** — they react to the same events but are different intents (Welcome Messages becomes the `IConnectionGreeter` collaborator). Moderation is a **passive `Observation`** (it runs *after* command dispatch and never blocks a message or command). AutoAdmin **reads** `ModerateChatTag` via the core [tag substrate](architecture.md#player-tags-plane-core-substrate) — it does **not** depend on the Player Tags feature.
- **Player Tags + Admin Actions** are player-centric and both contribute `IPlayerProfileBlock`s. Separate domains and settings; migrate together. The tag **substrate** (registry/assign/read + reset) is **core**; features contribute their own tag definitions + reconcilers, so nothing depends on the Player Tags feature to use tags.
- **Server Integration Config** bundles the thin `Cod4x*` / `Screenshots` namespaces into one feature. `ServerList` is platform-owned.
- **Live Status / Server Monitoring** is a platform capability, not a feature — too many features depend on "current map/players". Surfaced through the context.
- **Event persistence is platform-owned.** Features marked **E** contribute *enrichment / reaction* handlers; the canonical event write (chat message, connect/disconnect, map change, ban) is a platform **core-band** handler.

## Platform-core vs feature boundary

The [core / platform / feature tests](architecture.md#core-platform-and-features) applied to the estate.

### Platform / core (owned by hosts + SDK)

| Capability                                                                                           | Why it's core                                                                                 |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Event persistence** — canonical writes (chat message, connect/disconnect, map change, ban)         | single canonical write path                                                                   |
| **Live Status / Server Monitoring** — LiveStatus table + `GameServersStats` + `RecentPlayers`        | many features read "current map/players"                                                      |
| **Player tag substrate** — registry + assign/read (`IPlayerTagService`) + the reset orchestration    | shared by many features (moderation reads a tag, VPN writes tags, Player Tags owns base tags) |
| **Player identity resolution** (guid → id)                                                           | every player-scoped feature needs it                                                          |
| **GeoIP enrichment** (`PlayerIpResolved` + `geo-location`)                                           | shared by AutoAdmin, recent-players map, profiles                                             |
| **Identity & permissions** (`UserProfileForumsSync`; permission aggregation + structural validation) | underpins auth for everything                                                                 |
| **Data maintenance / retention** (prune chat / events / stats / IPs)                                 | estate-wide housekeeping                                                                      |
| **RCON / query transport** (`portal-servers-integration`; SDK `IRconGateway`)                        | shared transport for many features                                                            |
| **Event transport** (producer + Service Bus + host trigger stubs + pipeline/job runners)             | infrastructure                                                                                |
| **Shared clients / config / observability / health**                                                 | infrastructure                                                                                |
| **Cross-cutting settings namespaces** (`Shared`, `Agent`, `ServerList`)                              | not one feature's concern                                                                     |

### Features (enrich or react)

| Feature                                                                   | Kind                                                                                                                                                             | Sits on top of (core)                                                                                                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Maps**                                                                  | map-vote commands + jobs + UI                                                                                                                                    | live status / current map; owns rotation + popularity                                                                                    |
| **AutoAdmin** (VPN + Moderation + Protected Names)                        | connection collaborators (`IConnectionGuard` + `IProtectedNameEnforcer` on connect/ip-resolved) + a chat-moderation handler + a VPN-detected tag reconciler + UI | GeoIP enrichment + persisted chat + the core tag substrate; auto-enforces via RCON; moderation records an `Observation` (does not block) |
| **Chat Commands**                                                         | react (`ChatMessage`, post-persistence)                                                                                                                          | persisted chat message                                                                                                                   |
| **Welcome Messages**                                                      | react (`PlayerConnected`)                                                                                                                                        | identity resolution                                                                                                                      |
| **Player Tags**                                                           | enrich + reconcile + profile block                                                                                                                               | Players                                                                                                                                  |
| **Admin Actions**                                                         | react / workflow + UI + jobs                                                                                                                                     | Players; forum topics                                                                                                                    |
| **Bans** (files & enforcement)                                            | react (ban events) + jobs                                                                                                                                        | ban **persistence** is core; **file sync / push / enforcement** is the feature                                                           |
| **Demos**                                                                 | UI                                                                                                                                                               | demo metadata                                                                                                                            |
| **Broadcasts**                                                            | scheduled / react                                                                                                                                                | RCON `say` transport                                                                                                                     |
| **Analytics / Stats**                                                     | read / UI                                                                                                                                                        | core-written stats snapshots                                                                                                             |
| **Server Integration Config** (Screenshots + Cod4x plugin/power/commands) | settings + enforcement                                                                                                                                           | per-server config; CoD4x-only for plugin lifecycle                                                                                       |

Where a domain has both a canonical-write aspect and a reaction aspect (e.g. **Bans**), the write stays **core** and only the reaction is the feature.

## Reconciliation ownership & game scope

Each feature owns its reconciliation/jobs and declares its game applicability. Platform-wide reconciliations are **not** feature-owned.

| Reconciliation / job                                                                        | Cadence        | Kind                       | Owner                               |
| ------------------------------------------------------------------------------------------- | -------------- | -------------------------- | ----------------------------------- |
| `UserProfileForumsSync` (forum groups → claims; **preserves manual perms**)                 | hourly         | Reconcile (identity/perms) | **Platform** (auth)                 |
| `ResetSystemAssignedPlayerTags` (clears system-assigned tags; precedes all tag reconcilers) | daily 03:00    | Reset                      | **Platform / core** (tag substrate) |
| `ReconcileConnectedPlayerTags`                                                              | daily 03:30    | Reconcile                  | Player Tags                         |
| `ReconcileVpnDetectedTags`                                                                  | daily 04:00    | Reconcile                  | **AutoAdmin**                       |
| `ConnectedPlayerTagReconciliationSync`                                                      | 5 min          | Reconcile (live)           | Player Tags                         |
| `BanFileMonitor` (import latest ban files)                                                  | 10 min         | Reconcile (bans)           | Bans                                |
| `MapRotationCleanup`                                                                        | hourly         | Cleanup                    | Maps                                |
| `MapImageSync` (weekly, Wed) / `MapRedirectSync` / `RedirectToGameServerMapSync` (daily)    | weekly / daily | Sync                       | Maps                                |
| `MapPopularity` rebuild                                                                     | hourly         | Projection                 | Maps                                |
| `UnclaimedActionReminder`                                                                   | 6h             | Notify                     | Admin Actions                       |
| Prune chat / events / stats / IPs                                                           | hourly–daily   | Data maintenance           | **Platform**                        |

Constraints that survive the feature split:

1. **Order matters, across features.** The player-tag set is a **3-step** phased sequence — core `ResetSystemAssignedPlayerTags` (03:00) → Player Tags `ReconcileConnectedPlayerTags` (03:30) → AutoAdmin `ReconcileVpnDetectedTags` (04:00). The **reset is platform-owned** and must precede **every** feature's reconciler. These three keep their **separate cron triggers (03:00/03:30/04:00) for parity**, so the ordering is preserved by that spacing; `ReconciliationPhase` / `Order` in the shared `PlayerTags` set document and enforce the invariant for any set-driven (`RunSetAsync`) run and are available for later consolidation. (The VPN-detected tag is *also* written in real time by the connection guard on connect/ip-resolved; this daily job is the backstop.)
2. **System vs manual is preserved.** `UserProfileForumsSync` regenerates system claims but merges back manually-assigned `AdditionalPermission` claims (separate → regenerate → merge). This invariant survives any split and stays platform-owned.
3. **Platform-wide reconciliations stay central** (forum → permissions; generic pruning).

**Game scope per feature:**

| Feature                     | Game scope                                                       |
| --------------------------- | ---------------------------------------------------------------- |
| Maps                        | per-game (map pool differs by game)                              |
| Bans                        | per-game ban-file formats                                        |
| Player Tags / Admin Actions | all games                                                        |
| Chat Commands               | **per-command** `SupportedGameTypes`                             |
| AutoAdmin                   | per-game RCON enforcement (CoD family); Content Safety all games |
| Welcome Messages            | per-game templates                                               |
| Server Integration Config   | **CoD4x-only** for plugin lifecycle                              |

## Permissions ownership

Each feature owns its permission definitions in its `.Abstractions` package and contributes them via `IPermissionContributor`. `portal-web` aggregates them (catalogue authority); `portal-repository` validates claims **structurally only** and references no feature package. See [architecture.md](architecture.md#permissions-plane).

## Repo layout for one feature (Maps)

```
portal-feature-maps/
  src/
    XtremeIdiots.Portal.Features.Maps.Abstractions/   # MapsPermissions, maps DTOs
                                                      #   (no settings namespace — rotations are data via the API)
    XtremeIdiots.Portal.Features.Maps.Web/            # RCL: Maps/MapManager/MapRotations controllers+views +
                                                      #   maps ApiController (ApplicationPart), MapsNavigation,
                                                      #   MapPopularityTagHelper, MapRotationCfgParser
    XtremeIdiots.Portal.Features.Maps.Processing/     # MapVoteLike/DislikeCommand,
                                                      #   MapPopularityJob, MapImageSyncJob, MapRedirectSyncJob,
                                                      #   RedirectToGameServerMapSyncJob, MapRotationCleanupJob
                                                      #   (no MapChange handler — persistence stays platform)
    XtremeIdiots.Portal.Features.Maps.*.Tests/
  terraform/                                          # only if the feature owns infra (usually none — reuse host infra)
```

Three packages (`.Abstractions` + `.Web` + `.Processing`), each NBGV-versioned with a `.Testing` companion where it has non-trivial handlers. `.Web` is a Razor Class Library; `.Processing` carries both the event handlers and the scheduled/reconciliation jobs.

## Migration order

Each feature is a **build/side-by-side** phase followed by a **retire** phase (see the [phase folders](README.md#delivery-phases)).

1. **Maps** — pilot. Highest pain (5 hosts), self-contained, exercises **all planes** → proves the SDK end to end. *(phase-1 build, phase-2 retire + SDK freeze)*
2. **AutoAdmin** — VPN Protection + Chat Moderation + Protected Names. Proves a feature-owned reconciler (VPN-detected tags) on the core tag substrate, feature-provided dependencies (Content Safety), and moderation as a passive observation. *(phase-3 build, phase-4 retire)*
3. **Chat cluster** — Chat Commands + Welcome Messages (shared `ChatMessageEvent`/connect fan-out).
4. **Player cluster** — Player Tags + Admin Actions (shared profile blocks + phased reconciliation).
5. **Bans** — 5-host span; done once the SDK and reconciliation model are hardened.
6. **Long tail** — Demos, Broadcasts, Analytics, Server Integration Config.
7. **Read-only community tier** — a later feature built on the permission plane.

## Per-feature migration recipe

Every feature migration follows the same **build → side-by-side → retire** recipe (the [phase folders](README.md#delivery-phases) are worked examples):

1. **Scaffold** `portal-feature-<name>` (library repo, NBGV, `.Testing` companions).
2. **`.Abstractions`** — move the feature's settings contract(s) + validators and its `IPermissionContributor`; ship migrating contracts as **wire-compatible copies** so persisted JSON deserialises under both paths during side-by-side; snapshot-test the permission definitions equal today's. `Settings.Contracts.V1` keeps only platform namespaces and shrinks as features migrate.
3. **`.Processing`** *(if it has events/jobs)* — move handlers/commands/jobs; replace any per-game RCON `switch` with `IRconGateway`; wrap scheduled jobs in `IJobTelemetry`; preserve reconciliation phase/order and the forum-sync system-vs-manual merge. Feature-specific dependencies are provided via the feature's options builder; shared clients are consumed from host DI (SDK-asserted).
4. **`.Web`** *(if it has UI)* — move controllers/views (RCL), nav/profile/dashboard/settings contributors; reuse the central design system (no npm).
5. **Characterization tests** — record legacy behaviour first, then assert the feature path matches.
6. **Wire behind `Feature.<Name>.V2`**, one path at a time; enable dev → validate → enable prd → soak.
7. **Retire** — remove the legacy in-host implementation and the flag; flip the namespace's settings-contract guidance (see [deferred governance](decisions.md#deferred-governance-settings-contract-guidance-reconciliation)).
8. **SDK changes are additive only** and follow package-first-then-consume (surface at planning as a NuGet dependency gate).

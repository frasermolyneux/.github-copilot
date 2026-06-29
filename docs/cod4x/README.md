# CoD4x Server — Technical Documentation

Comprehensive, technical reference for the **CoD4X18 dedicated server** (`CoD4x_Server`) and its plugin SDK, written to accelerate integration work in the `portal-*` projects and to support building a bespoke **`portal-cod4x-plugin`** that enhances the in-game experience.

This set is **self-contained** — each document stands alone and is the canonical reference for its topic; it does not depend on any other repository's documentation.

## How portal repos consume this

- **portal-servers-integration** drives servers over RCON (query, RCON moderation, map sync). The [RCON system](rcon-system.md) and [RCON developer guide](rcon-developer-guide.md) define the wire protocol, command inputs, output shapes, and parsing regexes that the API client must implement.
- **portal-server-agent / portal-server-events** ingest live events. The [plugin system](plugin-system.md) event catalog and HTTP API show how telemetry can be pushed to the portal.
- **portal-repository / portal-web** key bans and identities on `playerid`/`steamid`. The [player authentication](player-authentication.md) doc is the canonical identity model.
- A future **portal-cod4x-plugin** uses the [plugin developer guide](plugin-developer-guide.md) to add chat commands, events, and HTTP callbacks into the portal APIs.

## Documents

| Doc                                                    | Audience                   | Summary                                                                                                                   |
| ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [player-authentication.md](player-authentication.md)   | All                        | GUIDs, SteamIDs, playerids, the 64-bit universe scheme, `sv_usesteam64id`, identity stability.                            |
| [admin-system.md](admin-system.md)                     | Operators, portal-web      | In-game admin commands, power levels (1–100), the in-memory ban system.                                                   |
| [rcon-system.md](rcon-system.md)                       | portal-servers-integration | Both RCON transports: Quake3 UDP and HL2/Source TCP streaming. Command inputs, validation, output shape, parsing regexes. |
| [plugin-system.md](plugin-system.md)                   | plugin authors             | Plugin shape/structure, event catalog, exported features, command model, build/distribute/load.                           |
| [rcon-developer-guide.md](rcon-developer-guide.md)     | external client devs       | End-to-end guide for building a typed RCON client (the portal pattern).                                                   |
| [plugin-developer-guide.md](plugin-developer-guide.md) | plugin authors             | End-to-end guide for building a CoD4x plugin (C/C++ and D).                                                               |
| [gsc-scripting.md](gsc-scripting.md)                   | plugin authors             | Server-side GSC: loading, language, `addScriptCommand`, native↔script bridge.                                             |
| [cvar-reference.md](cvar-reference.md)                 | Operators, portal          | Cvars for identity, RCON, bans, slots, demos/screenshots, paths.                                                          |
| [multi-server-fleet.md](multi-server-fleet.md)         | Operators, portal          | Shared base + per-home fleet topology, ports, per-server RCON secrets.                                                    |
| [anticheat-data-flow.md](anticheat-data-flow.md)       | portal moderation          | `getss`/`getmodules`, demos, arrival hooks, plugin events.                                                                |
| [server-build-and-abi.md](server-build-and-abi.md)     | maintainers                | Server build (x86), auth library, plugin ABI v4.000 gating, install/load.                                                 |

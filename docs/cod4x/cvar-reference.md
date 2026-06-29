# CoD4x — Cvar & Configuration Reference

The cvars that matter for portal integration, health checks, and fleet config. Values from the server defaults; flags shown as registered (`CVAR_ARCHIVE`, `CVAR_INIT`, `CVAR_ROM`). Set via config (`set <cvar> <value>`) or commandline (`+set <cvar> <value>`).

---

## 1. Identity & authentication
| Cvar               | Default             | Purpose                                                             |
| ------------------ | ------------------- | ------------------------------------------------------------------- |
| `sv_usesteam64id`  | 1                   | ID display: numeric 64-bit (1) vs `[U:..]` (0). Input accepts both. |
| `sv_authorizemode` | 1                   | 0 = accept all (no GUIDs); 1 = reject invalid GUID.                 |
| `sv_noauth`        | false (`CVAR_INIT`) | Start without client auth (unofficial clients). All GUIDs may be 0. |
| `sv_authtoken`     | —                   | Master/auth token for listing/auth.                                 |

## 2. RCON & admin
| Cvar                      | Default   | Purpose                                                        |
| ------------------------- | --------- | -------------------------------------------------------------- |
| `rcon_password`           | ""        | Quake3 UDP RCON password. Empty = RCON disabled.               |
| `sv_webadmin`             | true      | Enable HTTP web admin.                                         |
| `banlist_maxipbantime`    | 240 (min) | Cap on the short-lived IP ban; self-expires/clears on restart. |
| `sv_disableClientConsole` | false     | Block remote client console.                                   |

## 3. Slots & networking
| Cvar                                             | Default      | Purpose                     |
| ------------------------------------------------ | ------------ | --------------------------- |
| `sv_maxclients`                                  | —            | Total slots.                |
| `sv_privateClients`                              | 0 (0–64)     | Reserved slots.             |
| `sv_privatePassword`                             | ""           | Password for private slots. |
| `net_ip` / `net_port`                            | / 28960      | Bind address/port.          |
| `sv_hostname`                                    | `^5CoD4Host` | Server name.                |
| `sv_minPing`/`sv_maxPing`                        | 0            | Ping gate.                  |
| `sv_timeout`/`sv_connectTimeout`/`sv_zombieTime` | 40/90/2      | Disconnect timing.          |
| `sv_reconnectlimit`                              | 5            | Reconnect lockout seconds.  |

## 4. Maps & gameplay
| Cvar                         | Default         | Purpose                          |
| ---------------------------- | --------------- | -------------------------------- |
| `fs_game`                    | ""              | Mod dir (sub of `mods/`).        |
| `sv_mapRotation` / `Current` | ""              | Rotation lists.                  |
| `sv_randomMapRotation`       | false (archive) | Shuffle rotation.                |
| `sv_cheats`                  | false           | Cheats (devmap).                 |
| `sv_showasranked`            | false           | List as ranked even when modded. |

## 5. Demos, screenshots, downloads
| Cvar                                                                             | Default            | Purpose                                             |
| -------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------- |
| `sv_autodemorecord`                                                              | false              | Auto-record each client demo.                       |
| `sv_demoCompletedCmd` / `sv_screenshotArrivedCmd` / `sv_mapDownloadCompletedCmd` | ""                 | Run `fs_homepath/apps/<exe>` with arrived filename. |
| `sv_allowDownload` / `sv_wwwDownload` / `sv_wwwBaseURL`                          | true/false/""      | In-game & HTTP redirect downloads.                  |
| `sv_statusfilename`                                                              | `serverstatus.xml` | Status export.                                      |

## 6. Filesystem paths
- `fs_basepath` — base game (shared assets). `fs_homepath` — per-server data (configs, plugins, bans). `fs_game` — mod subdir. See [multi-server-fleet.md](multi-server-fleet.md).

## 7. Portal notes
- Health/config: verify `rcon_password`, `sv_usesteam64id`, `sv_maxclients`. Keep `rcon_password` in env/Key Vault, never source.
- `*ArrivedCmd` hooks bridge anti-cheat artifacts to portal — see [anticheat-data-flow.md](anticheat-data-flow.md).

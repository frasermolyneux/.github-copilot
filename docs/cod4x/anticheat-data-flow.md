# CoD4x — Anti-Cheat Data Flow

How the server captures client screenshots and module dumps, and how those artifacts arrive — for portal anti-cheat/demo ingest. Self-contained.

---

## 1. Triggers (admin/RCON)
| Command           | Power            | Effect                                                                   |
| ----------------- | ---------------- | ------------------------------------------------------------------------ |
| `getss <user      | all> [filename]` | 45                                                                       | Request a screenshot from a client (anti-cheat). |
| `getmodules <user | all> [filename]` | 45                                                                       | Request the client's loaded module list.         |
| `getss` errors    | —                | `Error: This player is not online` on bad handle; else a `Usage:` block. |
| `getmodules` ack  | —                | `Modules for <name> requested`.                                          |

`<user>` = online name or slot. Results are **asynchronous** — the trigger returns immediately; the artifact arrives later.

## 2. Arrival & demos
- `sv_autodemorecord` (default false) auto-records a demo for each connected client.
- On arrival the server can run an external app from `fs_homepath/apps/`:
  - `sv_screenshotArrivedCmd` — runs with the screenshot filename.
  - `sv_demoCompletedCmd` — runs with the completed demo filename.
  - `sv_mapDownloadCompletedCmd` — runs with the `usermaps/<map>` path.
  (`CVAR_INIT` in secure mode.)

## 3. Plugin events
A native plugin receives:
- `OnScreenshotArrived` — a requested screenshot landed.
- `OnDemoArrived` — a demo completed.
- `OnPlayerGotAuthInfo` — auth/identity resolved (correlate playerid/steamid).
Use these to push metadata to portal-repository/portal-server-events. See [plugin-system.md](plugin-system.md).

## 4. Portal ingest
- Trigger `getss`/`getmodules` over RCON ([rcon-system.md](rcon-system.md)); correlate the async arrival via the `*ArrivedCmd` hook or plugin event.
- Store artifacts + `playerid`/`steamid`; surface in moderation UI. Reason ≤126 chars on bans.
- Demos can feed existing demo tooling; key on player identity ([player-authentication.md](player-authentication.md)).

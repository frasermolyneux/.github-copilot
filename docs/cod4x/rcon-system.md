# CoD4x — RCON System

CoD4X18 exposes **two** remote-console transports. This is the primary integration surface for `portal-servers-integration`. This doc defines both protocols, command inputs, validation, output shape, and parsing regexes.

---

## 1. Two transports

| Transport             | Layer               | Best for                           | Auth                            | Output                             |
| --------------------- | ------------------- | ---------------------------------- | ------------------------------- | ---------------------------------- |
| **Quake3 RCON**       | UDP, connectionless | one-shot commands, bans, status    | `rcon_password`                 | OOB `print` text                   |
| **HL2 / Source RCON** | TCP, framed packets | persistent sessions + live streams | per-admin user/pass (`HL2Rcon`) | framed packets incl. async streams |

For the portal, **Quake3 UDP RCON** is the simplest and used by the ban/status flows. **Source RCON** is preferred for live tailing (console/chat/game-log/events streaming).

## 2. Quake3 RCON (UDP)

Out-of-band packet (four `0xFF` prefix bytes):

```
\xff\xff\xff\xffrcon <password> <command>
```

- Requires `rcon_password`. Runs as **System/Rcon** (admin id `0`, power 100).
- Response is one or more connectionless `print` packets — the same lines shown on the server console. Capture and concatenate them.
- Strip color codes (`\^\d`) from names before parsing. Bad input ⇒ a `Usage:` line; no map ⇒ `Server is not running.`

## 3. HL2 / Source RCON (TCP)

`hl2rcon.h` — framed packets, up to `MAX_RCONUSERS` (8) live admins. Per-user flags toggle live streams (`streamlog`, `streamchat`, `streamgamelog`, `streamevents`). Packet command IDs:

| ID  | Command                                               |
| --- | ----------------------------------------------------- |
| 0   | `SERVERDATA_RESPONSE_VALUE`                           |
| 2   | `SERVERDATA_EXECCOMMAND` / `SERVERDATA_AUTH_RESPONSE` |
| 3   | `SERVERDATA_AUTH`                                     |
| 64  | `TURNONSTREAM`                                        |
| 65  | `GAMELOG`                                             | 66 | `CONLOG`         | 67 | `CHAT` |
| 68  | `GETSTATUS`                                           | 69 | `STATUSRESPONSE` | 70 | `SAY`  | 71 | `EVENT` |

Stream events (`SERVERDATA_EVENT`): `PLAYERENTERGAME 0`, `PLAYERLEAVE 1`, `LEVELSTART 2`, `PLAYERENTERTEAM 3`. Authenticate with `SERVERDATA_AUTH`, then `TURNONSTREAM` to subscribe. Admins managed by `HL2Rcon_SetSourceRconAdmin_f` (user/pass/salt/power).

## 4. Command reference (inputs / output / regex)

Commands, powers, and ban outputs are summarised in [admin-system.md](admin-system.md); the regexes below are complete. Combined ID token: `(?P<id>\d{6,20}|\[U:\d+:\d+\]|STEAM_\d:\d:\d+)`.

### `status` — players
Row regex:
```regex
^\s*(?P<num>\d+)\s+(?P<score>-?\d+)\s+(?P<ping>CNCT|ZMBI|PRIM|\d+)\s+(?P<playerid>\d{6,20}|\[U:\d+:\d+\])\s+(?P<steamid>\d{1,20}|\[U:\d+:\d+\])\s+(?P<name>.+?)\s+(?P<lastmsg>\d+)\s+(?P<address>\[?[0-9a-fA-F:.]+\]?:\d+)\s+(?P<qport>\d+)\s+(?P<rate>\d+)\s*$
```

### `dumpbanlist` — bans
```regex
^(?P<index>\d+) playerid: (?P<playerid>\d{6,20}|\[U:\d+:\d+\]); nick: (?P<nick>.*?); adminsteamid: (?P<admin>System/Rcon|\d{1,20}|\[U:\d+:\d+\]); expire: (?P<expire>Never|.+?); reason: (?P<reason>.*)$
^(?P<count>\d+) Active bans$
```

### `permban <playerid> <reason>`
- online: `^attempting to add Banrecord for player: (?P<name>.+) id: (?P<id>…)$`
- offline: `^Banrecord added for id: (?P<id>…)$`

### `tempban <playerid> <N>m|h|d <reason>`
- online: `^Banrecord added for player: (?P<name>.+) id: (?P<id>…)$` (offline same as permban). Max 30 days.

### `unban <playerid>`
- `^Removing ban for Nick: (?P<nick>.*), PlayerID: (?P<id>…), Banreason: (?P<reason>.*)$` (silent if no match).

Generic error: `^Error: (?P<error>.+)$`. Other moderation: `kick`/`getss`/`getmodules`/`dumpuser`/`tell`/`say`/`map` (see [admin-system.md](admin-system.md) and [anticheat-data-flow.md](anticheat-data-flow.md)).

## 5. Behavioral notes
- IDs print numeric or `[U:..]` per `sv_usesteam64id`; both forms accepted as input.
- Don't trust ban confirmation lines for perm-vs-temp — reconcile with `dumpbanlist` `expire`.
- Outputs may be split across multiple packets; reassemble before regex.

Next: [rcon-developer-guide.md](rcon-developer-guide.md), identity model in [player-authentication.md](player-authentication.md).

# CoD4x — RCON Developer Guide

A practical, end-to-end guide for building an **external client** that drives a CoD4X18 server over RCON — the pattern `portal-servers-integration` uses. Read [rcon-system.md](rcon-system.md) (protocol/regex) and [player-authentication.md](player-authentication.md) (identity) first; this guide ties them into a working client.

---

## 1. Pick the transport
- **Quake3 UDP RCON** — default. Stateless, password-only, ideal for status/ban/moderation. Start here.
- **HL2/Source TCP RCON** — when you need live streaming (console/chat/game-log/events). Persistent socket, per-user auth.

## 2. Quake3 UDP client recipe
1. Open a UDP socket to `host:port` (default 28960).
2. Send: `\xff\xff\xff\xffrcon <password> <command>` (note 4 leading `0xFF`).
3. Receive one or more connectionless `print` packets; strip the `0xFF` header + `print` token, concatenate bodies until idle.
4. Parse using the [rcon-system.md](rcon-system.md) regexes.

Implementation tips: short receive timeout, reassemble multi-packet output before regex, retry idempotent reads, never log the password.

## 3. Core workflows
- **Discover players:** `status` → store `playerid`, `steamid`, name, ip (strip `\^\d`).
- **Ban:** `permban <playerid> <reason>` or `tempban <playerid> <N>m|h|d <reason>`; works offline with `playerid`.
- **Unban:** `unban <playerid>` (also clears IP ban).
- **Reconcile:** issue `dumpbanlist`, match `expire` — don't trust the confirmation line for perm-vs-temp.
- **Errors:** match `^Error: (?P<error>.+)$` and `Usage:` lines; `Server is not running.` ⇒ no map loaded.

## 4. Validation rules to enforce client-side
- Reason ≤ 126 chars; reject `" ; % / \`. Time `<N>m|h|d`, ≤ 30 days.
- Accept any ID form on input; canonicalise display to numeric 64-bit.
- Key everything on `playerid`; treat `steamid==0` as no-Steam.

## 5. Streaming (Source RCON)
`AUTH` → `TURNONSTREAM` → consume `GAMELOG/CONLOG/CHAT/EVENT` packets. Events: enter-game/leave/level-start/enter-team. Use for live portal ingest instead of polling `status`.

## 6. Portal alignment
- Wrap the transport in a typed client (`MX.Api` envelopes); expose status/ban/unban/say/kick. Mirrors portal-servers-integration's `IRconClientFactory`.
- Cache `status` (~5 min) like the existing query controller.
- Audit moderation actions (`IAuditLogger`); store admin steamid; RCON acts as `System/Rcon`.

## 7. Pitfalls
- Multi-packet output, color codes, `[U:..]` vs numeric, silent `unban`, live-server ban-file edits, secret leakage.

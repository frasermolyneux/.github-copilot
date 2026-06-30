# Chat Commands — Native Server

Commands the **CoD4x binary ships** (`kick`, `tempban`, `say`, `getss`, `permban`, `unban`, …). We do **not** implement these — the plugin **tunes** them so the portal controls their gating, via the new **`cod4xCommands`** namespace.

## Native commands are power-gated and retunable

Each native command has a minimum **power level** (kick 35, getss 45, tempban 50, say 70, permban/unban 80 — see [`../admin-system.md`](../admin-system.md)), and that minimum is **retunable** on the server (`setCmdMinPower` / `AdminChangeCommandPower`). "Mirroring" them in portal config means storing the **desired** power and letting the plugin apply it.

## Desired-state config (`cod4xCommands`)

```jsonc
// namespace: cod4xCommands  (per-server override → global → built-in default)
{
  "schemaVersion": 1,
  "commands": {
    "kick":     { "enabled": true,  "minPower": 35 },   // matches native default (Moderators keep kick)
    "tempban":  { "enabled": true,  "minPower": 55 },   // portal raises above native default 50
    "permban":  { "enabled": false },                    // disabled → portal-owned ban path instead
    "unban":    { "enabled": false },                    // lift only from the portal
    "getss":    { "enabled": true,  "minPower": 45 },
    "say":      { "enabled": true,  "minPower": 70 }
  }
}
```

The vocabulary is **power + enable**, which is why this is a separate namespace from [`chatCommands`](chat-commands-portal.md) (whose vocabulary is tags / freshness / response payloads). Don't overload one for the other.

## Reconciliation (plugin → server)

- The plugin reads `cod4xCommands` from its [settings cache](settings-and-offline-cache.md) and **applies it onto the server** on startup — retuning each command's required power.
- **Re-assert on every refresh** so a local admin retuning a power is corrected back to the portal's desired state (drift control).
- `"enabled": false` **disables the native command** — the hook for "disable native and route through a portal-owned command" (e.g. `permban`/`unban` off so the [portal is ban source of truth](bans-portal-authority.md); the plugin still *observes* native bans for import).

## Composition with role power

`cod4xCommands` (command → required power) composes with [`cod4xPower`](portal-role-mapping-to-power.md) (role tag → power band) to express **who can run what** entirely in portal config:

> A `HeadAdmin` (→ power 80) can run `kick` (req 35) and, if enabled, `permban` (req 80); a `Moderator` (→ 35) can run `kick` (req 35) but not `tempban` (req 55).

One role taxonomy drives both the native side (derived power) and the portal-text side (tags on `chatCommands`).

## Legacy servers

`cod4xCommands` only applies where the plugin runs (CoD4x). Legacy CoD2/4/5 have no native admin commands and no plugin — their moderation arrives as portal-owned `!kick` / `!ban` over RCON ([portal commands](chat-commands-portal.md)). The edit page hides native-command tuning for them.

## Related

- [Chat commands — portal-owned](chat-commands-portal.md)
- [Portal role mapping to power](portal-role-mapping-to-power.md)
- [Bans — portal as authority](bans-portal-authority.md)
- [`../admin-system.md`](../admin-system.md) — native command powers.

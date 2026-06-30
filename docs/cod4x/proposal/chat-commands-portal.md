# Chat Commands — Portal-Owned

Commands the **portal implements** (`!fu`, `!whoami`, `!register`, `!commands`, `!like`, `!dislike`, and future `!kick` / `!ban`). These live in the existing **`chatCommands`** settings namespace and are gated by **claims/tags**.

## One catalog, two executors

The defining idea: portal-owned commands are **defined once** and can be **executed in two places**:

| Executor | Servers | How |
|---|---|---|
| **portal-server-events** (today) | legacy CoD2/4/5 + any non-plugin server | matches chat from the log tail, replies / acts via RCON |
| **portal-cod4x-plugin** (new) | CoD4x with the plugin | matches chat **in-process**, replies via `Plugin_ChatPrintf` or a portal HTTP call |

Same definitions, same `chatCommands` config, **different runtime**. The plugin is simply a *second executor* of the existing catalog — there is **no separate "plugin commands" namespace** (that would cause drift between "the portal's `!fu`" and "the plugin's `!fu`").

## Persistence vs execution (no dropped or duplicated chat)

Moving command *execution* in-process must not lose chat history or moderation. So on plugin servers:

- The plugin **always** emits a `chat-message` event for **every** chat line — persisted and moderated by `portal-server-events`, exactly as today (command invocations included).
- The plugin **additionally** executes any matching command **in-process**.
- The **per-server source flag** governs execution downstream: `ChatMessageProcessor` **persists/moderates but skips command execution** for plugin-sourced servers (the plugin already executed it); legacy servers persist, moderate, *and* execute, as today.

**Decision:** no per-message "command-handled" marker is added — the per-server source flag is the single switch, and the small double-execution risk it carries in edge cases (e.g. a command disabled on a plugin server) is **accepted** rather than engineered around. Net: every line persisted + moderated, with command execution owned by one side per server.

## Compatibility metadata (drives edit-page filtering)

Add two attributes to each command descriptor:

- **`CompatibleGameTypes`** — which games the command applies to (e.g. universal vs CoD4x-only).
- **`ExecutionCapability`** — `PortalText` (parsed + delivered via RCON; works anywhere) vs `NativePlugin` (requires the plugin installed).

The game-server edit page filters to `CompatibleGameTypes.Contains(server.GameType)` and, for `NativePlugin`, whether the server actually runs the plugin — so only relevant commands are shown.

## Config shape (existing `chatCommands`)

Per-command entries already support what's needed — `enabled`, freshness (anti-replay), `requiredTags`, and a free-form `settings` payload (e.g. `!fu` messages). Resolution is per-server override → global → built-in default. No new namespace.

## Authorization

Portal commands gate on **tags/claims** (`RequiredTags`). The plugin authorizes in-process using the **tags carried in the cached roster** (`playerid → { power, tags }` — see [role mapping](portal-role-mapping-to-power.md)). Ungated commands (e.g. `!fu`) need no tags; gated ones (e.g. `!kick`) require the relevant role tag.

## Action commands and the future `!kick` / `!ban`

Today's portal commands are mostly canned responses plus `!register` / `!whoami`. `!kick` / `!ban` are **action** commands added to the same catalog:

- **Legacy** servers execute them via **RCON** (`portal-server-events` already has RCON delivery).
- **CoD4x** servers execute them **natively** in-plugin — but a `!ban` routes through the **portal-owned ban path** so the portal stays source of truth (see [bans](bans-portal-authority.md)).

This is exactly what `ExecutionCapability` + `CompatibleGameTypes` express: one definition, the right runtime per server.

## Relationship to native commands

Portal-owned commands (this doc) are distinct from **server-native** commands like `kick`/`tempban`/`say` that the CoD4x binary ships — those are *tuned*, not implemented by us, and live in a separate namespace ([native commands](chat-commands-native.md)). The dividing line is **who implements the command**, not where it runs.

## Related

- [Chat commands — native server](chat-commands-native.md)
- [Portal role mapping to power](portal-role-mapping-to-power.md) — the tags used for authorization.
- [Bans — portal as authority](bans-portal-authority.md) — where `!ban` routes.
- [Settings and offline cache](settings-and-offline-cache.md)

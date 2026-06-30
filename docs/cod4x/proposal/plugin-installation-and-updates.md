# Plugin Installation and Updates

The `portal-server-agent` (a separate repository) evolves from "event pump" into the **fleet lifecycle controller** for the plugin. It already has the two things needed: **FTP/SFTP write** access and **RCON**.

## Responsibilities

1. **Install** — upload the architecture-correct binary (`.so` / `.dll`) to `fs_homepath/plugins/`, then load it (`loadplugin <name>` via RCON, or `+loadplugin` on next start).
2. **Version-pin** — track the desired plugin version per server and reconcile.
3. **Provision config** — write the shared-app credential, the server's `ServerId` + `GameType`, and an optional first-run settings bootstrap (see [authentication and trust](authentication-and-trust.md), [settings](settings-and-offline-cache.md)).
4. **Health-verify** — confirm the plugin loaded and reports its expected version/health after load.
5. **Roll back** — on crash-loop or failed health, revert to the previously known-good version.

> Artifact (screenshot/demo) file retrieval is **not** the agent's job — `portal-sync` pulls those via `portal-servers-integration` ([screenshots](screenshots.md), [demos](demos.md)).

## Staged rollout

A plugin bug crashes the **live game server** (it is a 32-bit, in-process native module — see [risks](risks-and-open-questions.md)), so updates must be cautious:

- **Canary → ring → fleet.** Promote a new version through a small canary set, then rings, then the fleet — mirroring the existing ban-file stagger/jitter that already spreads work across ~80 servers.
- **Health gate between rings.** Only promote when the canary reports healthy for a soak window.
- **Automatic rollback** on crash-loop detection.

## Hot-reload assumption

**Working assumption:** `unloadplugin` + `loadplugin` work reliably while the server is live, so the agent updates the plugin **in place** (`unloadplugin` → upload new binary → `loadplugin`) without waiting for a map rotation or restart. The staged rollout + health-verify + auto-rollback above contain the blast radius if a specific build misbehaves.

If hot-reload later proves unreliable on the fleet's build, fall back to **update-on-map-rotation / update-on-restart** — a localised change to the update step, not the overall design. We design around hot-reload working for now.

## Version source

The plugin uses Nerdbank.GitVersioning (`version.json`) and the existing CI that publishes Linux-x86 and Windows-x86 artifacts. The agent consumes a published, pinned version per server rather than "latest."

## Mixed fleet & fallback

- Not every server runs CoD4x or accepts the plugin. The agent **keeps the log-tail path** for non-plugin game types (CoD2/CoD4/CoD5) and as the **migration fallback**.
- A per-server **source flag** selects "plugin-sourced" vs "agent-sourced" events so the two never double-count (see [event ingest](event-ingest-pipeline.md), [roadmap](roadmap-and-phasing.md)).

## Related

- [Authentication and trust](authentication-and-trust.md)
- [Settings and offline cache](settings-and-offline-cache.md)
- [Risks and open questions](risks-and-open-questions.md)

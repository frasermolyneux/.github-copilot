# Screenshots

Get client screenshots into the portal **regardless of where the capture was triggered** (RCON `getss`, in-game admin command, auto-capture, or plugin-initiated).

## Trigger-agnostic by design

CoD4x funnels every screenshot through a single plugin callback:

```c
PCL void OnScreenshotArrived(client_t* client, const char* path);   // sv_screenshot.c
```

It fires **downstream of all triggers**, so hooking arrival (not the trigger) automatically satisfies "ends up in the portal no matter who triggered it." The `client_t*` gives the **captured player's** identity, so attribution is correct even when an admin or the portal triggered it. (Reference: [`../anticheat-data-flow.md`](../anticheat-data-flow.md).)

- **On disk:** `fs_homepath/screenshots/<player>NNNN.jpg`
- **Size:** small (~100–500 KB)
- **Correlation:** `getss` accepts a basename argument — when the portal triggers a capture over RCON, pass a **correlation token** as the basename; the plugin echoes it from the arrival `path` for exact request↔artifact matching.

## Retrieval path: plugin emits, portal-sync pulls

The plugin does **not** transfer files. It only emits a **capture event**; the file is pulled server-side:

1. `OnScreenshotArrived` → plugin emits a **capture event** (player `playerid`/`steamid`, server, map, filename, trigger source, timestamp) via the normal [event ingest path](event-ingest-pipeline.md). No file I/O in the plugin.
2. **portal-server-events** consumes the capture event and **triggers portal-sync**.
3. **portal-sync** pulls the file off the game server using **portal-servers-integration**'s existing generic file API (`IFilesApi.ListEntries` / `GetContent`, binary mode; per-server FTP credentials already resolved), then posts it to **portal-repository** to store the blob and update the DB record.
4. **Reconcile sweep (every 4 hours):** portal-sync lists the `screenshots/` folder via portal-servers-integration and pulls anything not yet ingested — a safety net for any capture whose event was missed.

This mirrors portal-sync's existing patterns (timer + manual HTTP triggers, `IJobTelemetry.ExecuteAsync()`, the MapImageSync blob flow). Demos follow the **identical** pipeline ([demos](demos.md)).

## Portal side: greenfield (must be built)

Unlike demos, the portal has **no screenshot storage today** — only a legacy `screenshots` settings namespace (directory/pattern/poll) from the old external-monitoring design, which the plugin **supersedes**. New work required:

- A **`screenshots` blob container** (public-read, GUID-keyed) — reuse the map-image/demo blob pattern (`BlobServiceClient` + `DefaultAzureCredential`).
- A **`Screenshots` table** keyed to the captured **`Player`** — `PlayerId` (resolved from the captured `playerid`), plus server, map, timestamp, trigger source, `FileUri`.
- An **ingest endpoint** in `portal-repository`, **called by portal-sync** after it pulls the file, which resolves `(gameType, playerid)` → `Player.PlayerId` and links the row.
- A **gallery / moderation view** in `portal-web`.
- Authorization reusing the existing screenshot policies (currently config-only).

**Future state:** with the `PlayerId` link, a player's screenshots surface on the **player profile page** in portal-web (alongside demos — see [demos](demos.md)).

## Why not the external-command hook

CoD4x can run an external app via `sv_screenshotArrivedCmd` on arrival, but that means deploying and securing another binary in `fs_homepath/apps/`. The plugin event path is cleaner and already in-process — so we use it.

## Related

- [Demos](demos.md) — the large-artifact counterpart.
- [Event ingest pipeline](event-ingest-pipeline.md) — the egress/upload mechanics.
- [Identity model](identity-model.md) — player attribution.
- [`../anticheat-data-flow.md`](../anticheat-data-flow.md) — server-side capture reference.

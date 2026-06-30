# Demos

Get server-captured demos into the portal **regardless of trigger** — reusing the portal's already-built demo pipeline.

## Trigger-agnostic by design

Like [screenshots](screenshots.md), demos funnel through one plugin callback:

```c
PCL void OnDemoArrived(client_t* client, const char* demoname);   // sv_demo.c
```

It fires for every trigger (`sv_autodemorecord`, admin/RCON-initiated, plugin-initiated) and carries the captured player. (Reference: [`../anticheat-data-flow.md`](../anticheat-data-flow.md).)

- **On disk:** `fs_homepath` root, `demoNNNN.dm_1`
- **Size:** **large** — 5–100 MB+

## Retrieval path: plugin emits, portal-sync pulls

The plugin does **not** transfer the (large) file. It only emits a **capture event**; the file is pulled server-side:

1. The **plugin** emits a *capture event* (player `playerid`/`steamid`, server, map, filename, trigger source) via the normal [event ingest path](event-ingest-pipeline.md) — no file transfer.
2. **portal-server-events** consumes the capture event and **triggers portal-sync**.
3. **portal-sync** pulls the demo off the game server using **portal-servers-integration**'s existing generic file API (`IFilesApi.GetContent` in binary mode, with **byte-range** support for the large file; per-server FTP credentials already resolved), then uploads it via the existing portal demo endpoint.
4. **Reconcile sweep (every 4 hours):** portal-sync lists the demo folder via portal-servers-integration and pulls anything not yet ingested — a safety net for any capture whose event was missed.

This keeps multi-MB transfers entirely off the game loop, reuses portal-sync's existing job patterns (`IJobTelemetry.ExecuteAsync()`, MapImageSync blob flow), and uses portal-servers-integration for the server file interaction. Screenshots follow the **identical** pipeline ([screenshots](screenshots.md)).

## Portal side: already built (reuse)

The portal has a mature demo pipeline today (fed by the desktop "Demo Manager" and manual upload):

- **`Demos` table** + **`IDemosApi`** (`CreateDemo`, `SetDemoFile`).
- **`demos` blob container** (GUID-keyed, public-read).
- **`POST /v1.0/demos/{demoId}/file`** multipart upload.
- **`MX.CodDemoReader`** auto-extracts Title / Map / Mod / GameMode / ServerName / FileSize.

Server-capture is simply a **new source** into this pipeline.

## Link to the player profile

We have the **captured player's `playerid`** from the arrival callback, so a server-captured demo is linked to the portal **`Player`** (profile) on import: resolve `(gameType, playerid)` → `Player.PlayerId` (the player record almost always already exists from connect events; create-if-missing otherwise).

The existing `Demos` entity keys on **`UserProfileId` (the *uploader*)**, with no player link — fine for the desktop client, but server captures have no uploader; their subject is a **player**. So:

- the new **`PlayerId`** association (nullable; the captured `Player`), resolved from `playerid`, carries the subject player;
- the required **`UserProfileId`** (uploader) **defaults to the static Admin user profile** for server-captured demos (there is no human uploader); and
- a **capture-source marker** (server-captured vs uploaded) distinguishes the two origins.

This is a small, additive schema change (regenerate DataLib; expose in the V1/V2 DTOs).

**Future state:** with the `PlayerId` link in place, a player's server-captured demos can be surfaced on the **player profile page** in portal-web (alongside screenshots — see [screenshots](screenshots.md)).

## Related

- [Screenshots](screenshots.md) — the small-artifact counterpart (identical pipeline).
- [Event ingest pipeline](event-ingest-pipeline.md) — how the capture event reaches portal-server-events.
- [Identity model](identity-model.md) — player attribution.
- [`../anticheat-data-flow.md`](../anticheat-data-flow.md) — server-side capture reference.

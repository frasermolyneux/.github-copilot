#!/usr/bin/env node
// Minimal stdio smoke test: spawn the built server, perform an MCP initialize
// handshake, then call tools/list and print the tool names.
// Exit 0 on success, 1 on failure with diagnostics on stderr.

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "dist", "index.js");

const EXPECTED_TOOLS = [
  "get_quickstart",
  "list_instruction_groups",
  "recommend_entries",
  "list_instructions",
  "get_instruction",
  "search_instructions",
  "list_prompts",
  "get_prompt",
  "search_prompts",
  "list_agents",
  "get_agent",
  "search_agents",
  "list_skills",
  "get_skill",
  "search_skills",
  "get_catalog",
];

const child = spawn(process.execPath, [serverPath], {
  stdio: ["pipe", "pipe", "pipe"],
  env: process.env,
});

let buffer = "";
const pending = new Map();
let nextId = 1;

child.stderr.on("data", (chunk) => {
  process.stderr.write(`[server] ${chunk}`);
});

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let newlineIdx;
  while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg);
      }
    } catch (err) {
      process.stderr.write(`[smoke] failed to parse line: ${line}\n`);
    }
  }
});

child.on("error", (err) => {
  process.stderr.write(`[smoke] spawn error: ${err.message}\n`);
  process.exit(1);
});

function send(method, params) {
  const id = nextId++;
  const payload = { jsonrpc: "2.0", id, method, params };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify(payload) + "\n");
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`Timed out waiting for response to ${method}`));
      }
    }, 5000);
  });
}

function notify(method, params) {
  const payload = { jsonrpc: "2.0", method, params };
  child.stdin.write(JSON.stringify(payload) + "\n");
}

async function run() {
  const initResp = await send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "gh-copilot-mcp-smoke", version: "0.0.0" },
  });
  if (initResp.error) throw new Error(`initialize failed: ${JSON.stringify(initResp.error)}`);

  notify("notifications/initialized", {});

  const toolsResp = await send("tools/list", {});
  if (toolsResp.error) throw new Error(`tools/list failed: ${JSON.stringify(toolsResp.error)}`);

  const names = (toolsResp.result?.tools ?? []).map((t) => t.name).sort();
  console.log("Tools reported by server:");
  for (const n of names) console.log(`  - ${n}`);

  const missing = EXPECTED_TOOLS.filter((t) => !names.includes(t));
  if (missing.length > 0) {
    throw new Error(`Missing expected tools: ${missing.join(", ")}`);
  }

  // Bonus: exercise list_instructions to confirm content loading works end-to-end.
  const callResp = await send("tools/call", {
    name: "list_instructions",
    arguments: { limit: 5, offset: 0 },
  });
  if (callResp.error) throw new Error(`tools/call list_instructions failed: ${JSON.stringify(callResp.error)}`);
  const text = callResp.result?.content?.[0]?.text ?? "[]";
  const items = JSON.parse(text);
  if (!Array.isArray(items?.items) || items.items.length === 0) {
    throw new Error(`list_instructions returned no items (content root resolution likely failed)`);
  }
  console.log(`list_instructions returned ${items.items.length} items out of ${items.total} (first: ${items.items[0]?.name})`);

  const groupsResp = await send("tools/call", {
    name: "list_instruction_groups",
    arguments: {},
  });
  if (groupsResp.error) throw new Error(`tools/call list_instruction_groups failed: ${JSON.stringify(groupsResp.error)}`);
  const groupsText = groupsResp.result?.content?.[0]?.text ?? "[]";
  const groups = JSON.parse(groupsText);
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error("list_instruction_groups returned no groups");
  }
  console.log(`list_instruction_groups returned ${groups.length} groups (largest: ${groups[0]?.prefix})`);

  const catalogResp = await send("tools/call", {
    name: "get_catalog",
    arguments: {},
  });
  if (catalogResp.error) throw new Error(`tools/call get_catalog failed: ${JSON.stringify(catalogResp.error)}`);
  const catalogText = catalogResp.result?.content?.[0]?.text ?? "{}";
  const catalog = JSON.parse(catalogText);
  if (!catalog?.counts || typeof catalog.counts.instructions !== "number") {
    throw new Error("get_catalog returned invalid counts payload");
  }
  if (!Array.isArray(catalog.instructionsByPrefix)) {
    throw new Error("get_catalog returned invalid instructionsByPrefix payload");
  }
  if (!catalog?.kindHelp || typeof catalog.kindHelp.instructions !== "string") {
    throw new Error("get_catalog returned invalid kindHelp payload");
  }
  console.log(
    `get_catalog counts: instructions=${catalog.counts.instructions}, prompts=${catalog.counts.prompts}, agents=${catalog.counts.agents}, skills=${catalog.counts.skills}`
  );

  const quickstartResp = await send("tools/call", {
    name: "get_quickstart",
    arguments: {},
  });
  if (quickstartResp.error) throw new Error(`tools/call get_quickstart failed: ${JSON.stringify(quickstartResp.error)}`);
  const quickstartText = quickstartResp.result?.content?.[0]?.text ?? "{}";
  const quickstart = JSON.parse(quickstartText);
  if (!Array.isArray(quickstart?.startHere) || quickstart.startHere.length === 0) {
    throw new Error("get_quickstart returned invalid startHere payload");
  }
  console.log(`get_quickstart returned ${quickstart.startHere.length} startHere steps`);

  const recommendResp = await send("tools/call", {
    name: "recommend_entries",
    arguments: { task: "update build-and-test workflow" },
  });
  if (recommendResp.error) throw new Error(`tools/call recommend_entries failed: ${JSON.stringify(recommendResp.error)}`);
  const recommendText = recommendResp.result?.content?.[0]?.text ?? "{}";
  const recommend = JSON.parse(recommendText);
  if (!Array.isArray(recommend?.instructions) || !Array.isArray(recommend?.agents) || !Array.isArray(recommend?.prompts)) {
    throw new Error("recommend_entries returned invalid grouped recommendations");
  }
  console.log(`recommend_entries returned instructions=${recommend.instructions.length}, prompts=${recommend.prompts.length}, agents=${recommend.agents.length}`);

  console.log("SMOKE OK");
}

run()
  .then(() => {
    child.kill();
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`[smoke] FAIL: ${err.message}\n`);
    child.kill();
    process.exit(1);
  });

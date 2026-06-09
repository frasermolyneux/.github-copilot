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
  "list_instructions",
  "get_instruction",
  "search_instructions",
  "list_prompts",
  "get_prompt",
  "list_agents",
  "get_agent",
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
    arguments: {},
  });
  if (callResp.error) throw new Error(`tools/call list_instructions failed: ${JSON.stringify(callResp.error)}`);
  const text = callResp.result?.content?.[0]?.text ?? "[]";
  const items = JSON.parse(text);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`list_instructions returned no items (content root resolution likely failed)`);
  }
  console.log(`list_instructions returned ${items.length} items (first: ${items[0]?.name})`);

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

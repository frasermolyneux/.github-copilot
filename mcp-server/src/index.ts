#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listItems, resolveContentRoot } from "./content.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

async function main(): Promise<void> {
  // Resolve eagerly so a misconfigured content root fails fast with a clear stderr message.
  const root = resolveContentRoot();
  const counts = {
    instructions: listItems("instructions").length,
    prompts: listItems("prompts").length,
    agents: listItems("agents").length,
    skills: listItems("skills").length,
  };
  process.stderr.write(
    `[gh-copilot-mcp] content root: ${root} (instructions=${counts.instructions}, prompts=${counts.prompts}, agents=${counts.agents}, skills=${counts.skills})\n`
  );

  const server = new McpServer({
    name: "gh-copilot-mcp",
    version: "0.1.0",
  });

  registerTools(server);
  registerResources(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[gh-copilot-mcp] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});

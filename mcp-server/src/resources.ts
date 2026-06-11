import { readFileSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getItem, listItems, type Kind } from "./content.js";

const SINGULAR: Record<Kind, string> = {
  instructions: "instruction",
  prompts: "prompt",
  agents: "agent",
  skills: "skill",
};

function registerKind(server: McpServer, kind: Kind): void {
  const scheme = `frasermolyneux-copilot://${kind}/`;
  server.registerResource(
    SINGULAR[kind],
    new ResourceTemplate(`frasermolyneux-copilot://${kind}/{name}`, {
      list: async () => ({
        resources: listItems(kind).map((item) => ({
          uri: `${scheme}${item.name}`,
          name: item.name,
          description: item.description,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: `${SINGULAR[kind][0].toUpperCase()}${SINGULAR[kind].slice(1)} files`,
      description: `Raw ${SINGULAR[kind]} files from .github/${kind}/`,
      mimeType: "text/markdown",
    },
    async (uri, variables) => {
      const rawName = variables.name;
      const name = Array.isArray(rawName) ? rawName[0] : rawName;
      const item = getItem(kind, name);
      if (!item) {
        throw new Error(`Unknown ${SINGULAR[kind]}: ${name}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: readFileSync(item.path, "utf8"),
          },
        ],
      };
    }
  );
}

export function registerResources(server: McpServer): void {
  for (const kind of ["instructions", "prompts", "agents", "skills"] as const) {
    registerKind(server, kind);
  }
}

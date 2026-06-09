import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getItem,
  listItems,
  searchItems,
  type ItemFull,
  type ItemSummary,
  type Kind,
  type SearchHit,
} from "./content.js";

function asJson(value: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function notFound(kind: Kind, name: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `No ${kind.slice(0, -1)} found matching name "${name}". Try the list_${kind} tool to see available names.`,
      },
    ],
  };
}

function registerListTool(server: McpServer, kind: Kind) {
  server.registerTool(
    `list_${kind}`,
    {
      description: `List every ${kind.slice(0, -1)} file in .github/${kind}/ as { name, description, applyTo, path }.`,
      inputSchema: {},
    },
    async () => asJson(listItems(kind) satisfies ItemSummary[])
  );
}

function registerGetTool(server: McpServer, kind: Kind) {
  const singular = kind.slice(0, -1);
  server.registerTool(
    `get_${singular}`,
    {
      description: `Return a single ${singular} as { name, description, applyTo, path, frontmatter, content }. Accepts a bare name (e.g. "patterns.api-client") or full filename.`,
      inputSchema: { name: z.string().min(1).describe(`Bare name or full filename of the ${singular}`) },
    },
    async ({ name }) => {
      const item = getItem(kind, name);
      if (!item) return notFound(kind, name);
      return asJson(item satisfies ItemFull);
    }
  );
}

export function registerTools(server: McpServer): void {
  for (const kind of ["instructions", "prompts", "agents"] as const) {
    registerListTool(server, kind);
    registerGetTool(server, kind);
  }

  server.registerTool(
    "search_instructions",
    {
      description:
        "Case-insensitive substring search across instruction files. Scores: +3 per match in name, +2 in description/applyTo, +1 in body. Returns [{ name, snippet, score }] sorted by score.",
      inputSchema: {
        query: z.string().min(1).describe("Substring to search for"),
        limit: z.number().int().positive().max(50).optional().describe("Max results, default 10"),
      },
    },
    async ({ query, limit }) => asJson(searchItems("instructions", query, limit ?? 10) satisfies SearchHit[])
  );
}

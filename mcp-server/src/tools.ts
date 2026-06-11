import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  browseInstructions,
  getItem,
  getCatalogSummary,
  getQuickstartSummary,
  listInstructionGroups,
  listItems,
  recommendEntries,
  searchItems,
  type BrowseResult,
  type InstructionGroupSummary,
  type ItemFull,
  type ItemSummary,
  type Kind,
  type QuickstartSummary,
  type RecommendationResult,
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
  if (kind === "instructions") {
    server.registerTool(
      "list_instructions",
      {
        description:
          "Browse instructions with optional narrowing. Start here after get_catalog when you know the relevant prefix or applyTo hint. Returns { total, offset, limit, hasMore, items }.",
        inputSchema: {
          prefix: z.string().min(1).optional().describe("Optional prefix group such as metadata, workflows, platform, shared, or standards"),
          applyToContains: z.string().min(1).optional().describe("Optional case-insensitive substring to match inside applyTo"),
          limit: z.number().int().positive().max(200).optional().describe("Page size, default 25, max 200"),
          offset: z.number().int().min(0).optional().describe("Zero-based offset for paging, default 0"),
        },
      },
      async ({ prefix, applyToContains, limit, offset }) =>
        asJson(browseInstructions({ prefix, applyToContains, limit, offset }) satisfies BrowseResult<ItemSummary>)
    );
    return;
  }

  const listDescription =
    kind === "prompts"
      ? "List every prompt file in .github/prompts/ as { name, description, path }. Use this to browse reusable guided flows."
      : kind === "agents"
        ? "List every agent file in .github/agents/ as { name, description, path }. Use this to browse delegated specialist workers."
        : "List every skill file in .github/skills/ as { name, description, path }. Use this to browse reusable playbooks when skills are published.";

  server.registerTool(
    `list_${kind}`,
    {
      description: listDescription,
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
      description: `Return a single ${singular} as { name, description, applyTo, path, frontmatter, content }. Use this after list/search when you want the exact source text. Accepts a bare name (e.g. "patterns.api-client") or full filename.`,
      inputSchema: { name: z.string().min(1).describe(`Bare name or full filename of the ${singular}`) },
    },
    async ({ name }) => {
      const item = getItem(kind, name);
      if (!item) return notFound(kind, name);
      return asJson(item satisfies ItemFull);
    }
  );
}

function registerSearchTool(server: McpServer, kind: Kind) {
  server.registerTool(
    `search_${kind}`,
    {
      description:
        `Case-insensitive substring search across ${kind}. Use this when you know the topic but not the exact name. Scores: +3 per match in name, +2 in description/applyTo, +1 in body. Returns [{ name, snippet, score }] sorted by score.`,
      inputSchema: {
        query: z.string().min(1).describe(`Substring to search for in ${kind}`),
        limit: z.number().int().positive().max(50).optional().describe("Max results, default 10"),
      },
    },
    async ({ query, limit }) => asJson(searchItems(kind, query, limit ?? 10) satisfies SearchHit[])
  );
}

export function registerTools(server: McpServer): void {
  for (const kind of ["instructions", "prompts", "agents", "skills"] as const) {
    registerListTool(server, kind);
    registerGetTool(server, kind);
    registerSearchTool(server, kind);
  }

  server.registerTool(
    "get_catalog",
    {
      description:
        "Start here. Return a token-efficient catalog summary: item counts, kind summaries, instruction taxonomy by prefix, and freshness metadata (git SHA + last commit date).",
      inputSchema: {},
    },
    async () => asJson(getCatalogSummary())
  );

  server.registerTool(
    "get_quickstart",
    {
      description:
        "Return a compact quickstart for choosing between instructions, prompts, and agents, including task-routing examples and the recommended first calls.",
      inputSchema: {},
    },
    async () => asJson(getQuickstartSummary() satisfies QuickstartSummary)
  );

  server.registerTool(
    "list_instruction_groups",
    {
      description:
        "List instruction prefix groups such as metadata, patterns, platform, shared, standards, tenant, and workflows with counts and example names.",
      inputSchema: {},
    },
    async () => asJson(listInstructionGroups() satisfies InstructionGroupSummary[])
  );

  server.registerTool(
    "recommend_entries",
    {
      description:
        "Recommend likely instructions, prompts, and agents for a natural-language task. Use this when you know the task but not the right catalog entrypoints.",
      inputSchema: {
        task: z.string().min(1).describe("Natural-language description of the task you want to perform"),
      },
    },
    async ({ task }) => asJson(recommendEntries(task) satisfies RecommendationResult)
  );
}

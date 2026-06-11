import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

export type Kind = "instructions" | "prompts" | "agents" | "skills";

const SUFFIX: Record<Kind, string> = {
  instructions: ".instructions.md",
  prompts: ".prompt.md",
  agents: ".agent.md",
  skills: ".skill.md",
};

export interface ItemSummary {
  name: string;
  description: string;
  applyTo?: string;
  path: string;
}

export interface ItemFull extends ItemSummary {
  frontmatter: Record<string, unknown>;
  content: string;
}

export interface SearchHit {
  name: string;
  snippet: string;
  score: number;
}

export interface BrowseResult<T> {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  items: T[];
}

export interface InstructionGroupSummary {
  prefix: string;
  description: string;
  count: number;
  examples: string[];
}

export interface QuickstartSummary {
  generatedAtUtc: string;
  startHere: string[];
  kindHelp: Record<Kind, string>;
  taskRouting: Array<{
    task: string;
    use: string[];
  }>;
  referenceInstruction: { name: string; description: string; path: string } | null;
}

export interface RecommendationResult {
  task: string;
  inferredFocus: string[];
  recommendedFlow: string[];
  instructions: SearchHit[];
  prompts: SearchHit[];
  agents: SearchHit[];
}

export interface CatalogSummary {
  generatedAtUtc: string;
  freshness: {
    gitSha: string | null;
    lastCommitDateUtc: string | null;
  };
  counts: Record<Kind, number>;
  kindHelp: Record<Kind, string>;
  quickstart: {
    name: string;
    description: string;
    path: string;
  } | null;
  instructionsByPrefix: InstructionGroupSummary[];
}

const KIND_HELP: Record<Kind, string> = {
  instructions: "Rules, standards, patterns, and platform/shared contracts.",
  prompts: "Reusable guided flows for creating or updating repo content.",
  agents: "Specialist delegated workers for execution, alignment, or review.",
  skills: "Reusable domain playbooks when the catalog publishes them.",
};

let cachedRoot: string | null = null;
let cachedFreshness: { value: { gitSha: string | null; lastCommitDateUtc: string | null }; fetchedAtMs: number } | null = null;
const FRESHNESS_TTL_MS = 30_000;

/**
 * Resolves the content root containing `.github/instructions/`, `.github/prompts/`,
 * `.github/agents/`. Honours `GH_COPILOT_CONTENT_ROOT` first; otherwise walks up
 * from this script's directory looking for a sibling `.github/instructions/`.
 */
export function resolveContentRoot(): string {
  if (cachedRoot) return cachedRoot;

  const envRoot = process.env.GH_COPILOT_CONTENT_ROOT;
  if (envRoot && envRoot.trim().length > 0) {
    const abs = resolve(envRoot);
    if (!hasInstructions(abs)) {
      throw new Error(
        `GH_COPILOT_CONTENT_ROOT is set to "${abs}" but no .github/instructions/ directory was found there.`
      );
    }
    cachedRoot = abs;
    return abs;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  let current = here;
  // Walk up at most 10 levels to avoid runaway traversal. Each ascended directory
  // is checked for all three sibling catalogs (instructions/prompts/agents).
  for (let i = 0; i < 10; i++) {
    if (hasInstructions(current)) {
      cachedRoot = current;
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error(
    "Unable to locate the .github-copilot content root. Set GH_COPILOT_CONTENT_ROOT to the repository root, " +
    "or install this server inside a folder under .github-copilot."
  );
}

/**
 * Recognises a directory as a `.github-copilot` content root only when it has all
 * three core sibling catalogs (`instructions`, `prompts`, `agents`). Requiring all
 * three makes accidental collision with a consumer repo's own `.github/instructions/`
 * during walk-up resolution effectively impossible.
 */
function hasInstructions(dir: string): boolean {
  try {
    for (const kind of ["instructions", "prompts", "agents"] as const) {
      const probe = join(dir, ".github", kind);
      if (!existsSync(probe) || !statSync(probe).isDirectory()) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function dirFor(kind: Kind): string {
  return join(resolveContentRoot(), ".github", kind);
}

function fileNameToBare(filename: string, kind: Kind): string | null {
  const suffix = SUFFIX[kind];
  if (!filename.endsWith(suffix)) return null;
  return filename.slice(0, -suffix.length);
}

function normaliseName(input: string, kind: Kind): string {
  const suffix = SUFFIX[kind];
  const base = basename(input);
  if (base.endsWith(suffix)) return base.slice(0, -suffix.length);
  if (base.endsWith(".md")) return base.slice(0, -3);
  return base;
}

function readItem(kind: Kind, bareName: string): ItemFull | null {
  const path = join(dirFor(kind), `${bareName}${SUFFIX[kind]}`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const parsed = matter(raw);
  const fm = (parsed.data ?? {}) as Record<string, unknown>;
  const description = typeof fm.description === "string" ? fm.description : "";
  const fmName = typeof fm.name === "string" ? fm.name : undefined;
  const applyToRaw = fm.applyTo;
  const applyTo =
    typeof applyToRaw === "string"
      ? applyToRaw
      : Array.isArray(applyToRaw)
        ? applyToRaw.join(",")
        : undefined;
  return {
    name: fmName ?? bareName,
    description,
    applyTo,
    path,
    frontmatter: fm,
    content: parsed.content,
  };
}

export function listItems(kind: Kind): ItemSummary[] {
  const dir = dirFor(kind);
  if (!existsSync(dir)) return [];
  const out: ItemSummary[] = [];
  for (const entry of readdirSync(dir)) {
    const bare = fileNameToBare(entry, kind);
    if (!bare) continue;
    const full = readItem(kind, bare);
    if (!full) continue;
    out.push({
      name: full.name,
      description: full.description,
      applyTo: full.applyTo,
      path: full.path,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export function browseInstructions(options?: {
  prefix?: string;
  applyToContains?: string;
  limit?: number;
  offset?: number;
}): BrowseResult<ItemSummary> {
  const prefix = options?.prefix?.trim().toLowerCase();
  const applyToContains = options?.applyToContains?.trim().toLowerCase();
  const offset = Math.max(0, options?.offset ?? 0);
  const limit = Math.min(200, Math.max(1, options?.limit ?? 25));

  let items = listItems("instructions");

  if (prefix) {
    items = items.filter((item) => {
      const name = item.name.toLowerCase();
      return name === prefix || name.startsWith(`${prefix}.`);
    });
  }

  if (applyToContains) {
    items = items.filter((item) => item.applyTo?.toLowerCase().includes(applyToContains) ?? false);
  }

  const total = items.length;
  const paged = items.slice(offset, offset + limit);
  return {
    total,
    offset,
    limit,
    hasMore: offset + paged.length < total,
    items: paged,
  };
}

export function getItem(kind: Kind, name: string): ItemFull | null {
  const bare = normaliseName(name, kind);
  const direct = readItem(kind, bare);
  if (direct) return direct;
  // Fallback: scan for a file whose frontmatter name matches.
  for (const summary of listItems(kind)) {
    if (summary.name === name || summary.name === bare) {
      const refetch = readItem(kind, fileNameToBare(basename(summary.path), kind)!);
      if (refetch) return refetch;
    }
  }
  return null;
}

export function searchItems(kind: Kind, query: string, limit = 10): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const summary of listItems(kind)) {
    const full = readItem(kind, fileNameToBare(basename(summary.path), kind)!);
    if (!full) continue;

    let score = 0;
    score += countOccurrences(full.name.toLowerCase(), q) * 3;
    score += countOccurrences(full.description.toLowerCase(), q) * 2;
    if (full.applyTo) score += countOccurrences(full.applyTo.toLowerCase(), q) * 2;
    const body = full.content.toLowerCase();
    const bodyHits = countOccurrences(body, q);
    score += bodyHits;

    if (score === 0) continue;

    let snippet = full.description;
    if (bodyHits > 0) {
      const idx = body.indexOf(q);
      const start = Math.max(0, idx - 60);
      const end = Math.min(full.content.length, idx + q.length + 60);
      snippet = (start > 0 ? "…" : "") + full.content.slice(start, end).replace(/\s+/g, " ").trim() + (end < full.content.length ? "…" : "");
    }
    hits.push({ name: full.name, snippet, score });
  }
  hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return hits.slice(0, Math.max(1, limit));
}

export function getCatalogSummary(): CatalogSummary {
  const generatedAtUtc = new Date().toISOString();
  const counts = {
    instructions: listItems("instructions").length,
    prompts: listItems("prompts").length,
    agents: listItems("agents").length,
    skills: listItems("skills").length,
  };

  const instructions = listItems("instructions");
  const instructionsByPrefix = buildInstructionPrefixSummary(instructions);
  const quickstart = getItem("instructions", "catalog.quickstart");

  return {
    generatedAtUtc,
    freshness: getGitFreshness(),
    counts,
    kindHelp: KIND_HELP,
    quickstart: quickstart
      ? {
        name: quickstart.name,
        description: quickstart.description,
        path: quickstart.path,
      }
      : null,
    instructionsByPrefix,
  };
}

export function listInstructionGroups(): InstructionGroupSummary[] {
  return buildInstructionPrefixSummary(listItems("instructions"));
}

export function getQuickstartSummary(): QuickstartSummary {
  const quickstart = getItem("instructions", "catalog.quickstart");
  return {
    generatedAtUtc: new Date().toISOString(),
    startHere: [
      "Call get_catalog first for top-level counts, kind summaries, and freshness.",
      "Call get_quickstart when you want a compact chooser between instructions, prompts, and agents.",
      "Use list_instruction_groups or list_instructions({ prefix }) to narrow by domain before reading individual files.",
      "Use recommend_entries({ task }) when you know the task but not the right catalog entrypoints.",
    ],
    kindHelp: KIND_HELP,
    taskRouting: [
      {
        task: "Update a workflow",
        use: ["workflow instructions", "workflow prompts", "align-project-workflows agent"],
      },
      {
        task: "Review in-progress changes",
        use: ["standards/patterns instructions", "code-review agent"],
      },
      {
        task: "Update README / CONTRIBUTING / SECURITY / repo instructions",
        use: ["metadata instructions", "update-project-metadata agent"],
      },
      {
        task: "Figure out a platform/shared contract for a repo",
        use: ["platform.* instructions", "shared.* instructions", "get_catalog"],
      },
    ],
    referenceInstruction: quickstart
      ? {
        name: quickstart.name,
        description: quickstart.description,
        path: quickstart.path,
      }
      : null,
  };
}

export function recommendEntries(task: string): RecommendationResult {
  const lowered = task.trim().toLowerCase();
  const focus = inferFocus(lowered);
  const terms = expandRecommendationTerms(lowered, focus);

  return {
    task,
    inferredFocus: focus,
    recommendedFlow: buildRecommendedFlow(focus),
    instructions: combinedSearch("instructions", terms, 5),
    prompts: combinedSearch("prompts", terms, 5),
    agents: combinedSearch("agents", terms, 5),
  };
}

function buildInstructionPrefixSummary(instructions: ItemSummary[]): InstructionGroupSummary[] {
  const prefixMap = new Map<string, { count: number; examples: string[] }>();
  for (const item of instructions) {
    const firstDot = item.name.indexOf(".");
    const prefix = firstDot > 0 ? item.name.slice(0, firstDot) : "other";
    const bucket = prefixMap.get(prefix) ?? { count: 0, examples: [] };
    bucket.count++;
    if (bucket.examples.length < 3) {
      bucket.examples.push(item.name);
    }
    prefixMap.set(prefix, bucket);
  }

  const descriptions = new Map<string, string>();
  for (const prefix of prefixMap.keys()) {
    const primary = getItem("instructions", `${prefix}.instructions`);
    if (primary && primary.description) {
      descriptions.set(prefix, primary.description);
      continue;
    }
    const fallback = getItem("instructions", `${prefix}`);
    if (fallback && fallback.description) {
      descriptions.set(prefix, fallback.description);
      continue;
    }

    const prefixMatch = instructions.find((item) => item.name === prefix || item.name.startsWith(`${prefix}.`));
    if (prefixMatch && prefixMatch.description) {
      descriptions.set(prefix, prefixMatch.description);
      continue;
    }

    descriptions.set(prefix, "No prefix summary available.");
  }

  return Array.from(prefixMap.entries())
    .map(([prefix, data]) => ({
      prefix,
      description: descriptions.get(prefix) ?? "No prefix summary available.",
      count: data.count,
      examples: data.examples,
    }))
    .sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix));
}

function inferFocus(loweredTask: string): string[] {
  const focus = new Set<string>();
  if (/(workflow|github actions|dependabot|deploy|pr verify|build-and-test|codequality)/.test(loweredTask)) focus.add("workflow");
  if (/(readme|contributing|security|copilot instructions|agents.md|codeowners|issue template|pull request template|metadata)/.test(loweredTask)) focus.add("metadata");
  if (/(terraform|iac|infrastructure|app service|dns|monitoring|platform|remote state)/.test(loweredTask)) focus.add("platform");
  if (/(review|audit|findings|risk)/.test(loweredTask)) focus.add("review");
  if (/(prompt|agent|instruction|catalog|discoverability|mcp)/.test(loweredTask)) focus.add("catalog");
  if (focus.size === 0) focus.add("general");
  return Array.from(focus);
}

function expandRecommendationTerms(loweredTask: string, focus: string[]): string[] {
  const terms = new Set<string>();
  if (loweredTask) terms.add(loweredTask);
  for (const word of loweredTask.split(/[^a-z0-9.-]+/)) {
    if (word.length >= 4) terms.add(word);
  }
  for (const bucket of focus) {
    switch (bucket) {
      case "workflow":
        terms.add("workflow");
        terms.add("workflows");
        break;
      case "metadata":
        terms.add("metadata");
        terms.add("readme");
        break;
      case "platform":
        terms.add("platform");
        terms.add("terraform");
        break;
      case "review":
        terms.add("review");
        terms.add("code-review");
        break;
      case "catalog":
        terms.add("catalog");
        terms.add("mcp");
        break;
      default:
        break;
    }
  }
  return Array.from(terms);
}

function buildRecommendedFlow(focus: string[]): string[] {
  if (focus.includes("review")) {
    return [
      "Start with recommend_entries to shortlist relevant instructions and the code-review agent.",
      "Read the top matching standards/patterns instructions before review.",
      "Use the code-review agent when you want a findings-first assessment.",
    ];
  }
  if (focus.includes("workflow")) {
    return [
      "Start with list_instruction_groups or list_instructions({ prefix: 'workflows' }).",
      "Read the workflow-specific instruction plus its category layers.",
      "Use the matching workflow prompt or align-project-workflows agent if you want delegated changes.",
    ];
  }
  if (focus.includes("metadata")) {
    return [
      "Start with list_instructions({ prefix: 'metadata' }).",
      "Read the universal metadata instruction first, then the file-specific one.",
      "Use the update-project-metadata agent if you want delegated multi-file updates.",
    ];
  }
  return [
    "Start with get_catalog for the top-level map.",
    "Use list_instruction_groups to pick the right domain.",
    "Read the best matching instruction first, then use prompts/agents if the task needs guided authoring or delegation.",
  ];
}

function combinedSearch(kind: Kind, terms: string[], limit: number): SearchHit[] {
  const byName = new Map<string, SearchHit>();
  for (const term of terms) {
    for (const hit of searchItems(kind, term, 20)) {
      const existing = byName.get(hit.name);
      if (!existing) {
        byName.set(hit.name, { ...hit });
      } else {
        existing.score += hit.score;
      }
    }
  }
  return Array.from(byName.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function getGitFreshness(): { gitSha: string | null; lastCommitDateUtc: string | null } {
  const now = Date.now();
  if (cachedFreshness && now - cachedFreshness.fetchedAtMs < FRESHNESS_TTL_MS) {
    return cachedFreshness.value;
  }

  try {
    const root = resolveContentRoot();
    const sha = execSync("git rev-parse --short HEAD", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf8")
      .trim();
    const date = execSync("git log -1 --format=%cI", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf8")
      .trim();
    const value = {
      gitSha: sha.length > 0 ? sha : null,
      lastCommitDateUtc: date.length > 0 ? date : null,
    };
    cachedFreshness = { value, fetchedAtMs: now };
    return value;
  } catch {
    const value = {
      gitSha: null,
      lastCommitDateUtc: null,
    };
    cachedFreshness = { value, fetchedAtMs: now };
    return value;
  }
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  while (true) {
    const i = haystack.indexOf(needle, from);
    if (i === -1) return count;
    count++;
    from = i + needle.length;
  }
}

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

export type Kind = "instructions" | "prompts" | "agents";

const SUFFIX: Record<Kind, string> = {
  instructions: ".instructions.md",
  prompts: ".prompt.md",
  agents: ".agent.md",
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

let cachedRoot: string | null = null;

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
 * three sibling catalogs (`instructions`, `prompts`, `agents`). Requiring all
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

import { Evaluator } from "@uicast/expr";
import type { ComponentEntry } from "@uicast/core";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { insertSeedContent, SEED_CHATS, SEED_PAGES } from "./seed-content";
import { insertStarterData } from "./starter-data";
import { domainTools } from "@/tools";

// Seeds the public demo account (slug "uicast"): its domain data, three
// hand-authored pages, and two multi-turn chats. Idempotent — the user is
// recreated, cascades wipe the old content. Every expression is validated
// against the current language before insert, so a language change fails the
// seed loudly.

const SYSTEM_SLUG = "uicast";
const ev = new Evaluator({ functions: domainTools });

import { allDefinitions } from "@uicast/shadcn-catalog/defs";

const DEFS = new Map(allDefinitions.map((def) => [def.name, def]));

/** The output contract's structural rules (§1 tree, §4 scope names, §6 lists), enforced on every seed document. */
function validateStructure(where: string, entries: ComponentEntry[]): void {
  const byKey = new Map(entries.map((e) => [e.key, e]));
  if (byKey.size !== entries.length) throw new Error(`[${where}] duplicate keys`);
  const referenced = new Map<string, number>();
  for (const e of entries) {
    for (const child of e.children ?? []) {
      if (!byKey.has(child)) throw new Error(`[${where}] "${e.key}" references missing child "${child}"`);
      referenced.set(child, (referenced.get(child) ?? 0) + 1);
    }
  }
  const roots = entries.filter((e) => !referenced.has(e.key));
  if (roots.length !== 1) {
    throw new Error(`[${where}] expected exactly one root, got: ${roots.map((r) => r.key).join(", ")}`);
  }
  const multi = [...referenced.entries()].filter(([, n]) => n > 1);
  if (multi.length) throw new Error(`[${where}] children referenced more than once: ${multi.map(([k]) => k).join(", ")}`);
  const asNames = new Set<string>();
  for (const e of entries) {
    if (e.each) {
      if (!e.as) throw new Error(`[${where}] list "${e.key}" is missing "as"`);
      if (asNames.has(e.as)) throw new Error(`[${where}] duplicate list scope name "${e.as}"`);
      asNames.add(e.as);
      if (e.key === roots[0].key) throw new Error(`[${where}] a list cannot be the root`);
    }
    const def = DEFS.get(e.component);
    if (!def) throw new Error(`[${where}] "${e.key}" uses unknown component "${e.component}"`);
    for (const cb of Object.keys(e.callbacks ?? {})) {
      if (!def.callbacks || !(cb in def.callbacks)) {
        throw new Error(`[${where}] "${e.key}" wires undeclared callback "${cb}" on ${e.component}`);
      }
    }
  }
}

function validateEntries(where: string, entries: ComponentEntry[]): void {
  validateStructure(where, entries);
  const exprs: string[] = [];
  for (const entry of entries) {
    const vs = (v: unknown) => {
      if (v && typeof v === "object" && "expr" in (v as object)) {
        const e = (v as { expr?: unknown }).expr;
        if (typeof e === "string") exprs.push(e);
      }
    };
    vs(entry.props);
    if (typeof entry.hidden === "string") exprs.push(entry.hidden);
    if (typeof entry.loading === "string") exprs.push(entry.loading);
    if (typeof entry.each === "string") exprs.push(entry.each);
    for (const step of entry.seed ?? []) vs(step);
    for (const steps of Object.values(entry.callbacks ?? {})) for (const step of steps) vs(step);
  }
  for (const e of exprs) {
    try {
      ev.validate(e);
    } catch (err) {
      throw new Error(`[${where}] invalid expression: ${e}\n  ${(err as Error).message}`);
    }
  }
}


function validateFences(): void {
  for (const chat of SEED_CHATS) {
    for (const turn of chat.turns) {
      const fences = turn.text.match(/```uicast\n([\s\S]*?)```/g) ?? [];
      for (const fence of fences) {
        const lines = fence
          .replace(/```uicast\n/, "")
          .replace(/```$/, "")
          .trim()
          .split("\n");
        const entries = lines.map((line) => JSON.parse(line) as ComponentEntry);
        validateEntries(chat.title, entries);
      }
    }
  }
}

async function main() {
  for (const page of SEED_PAGES) validateEntries(page.title, page.entries);
  validateFences();

  const [existing] = await db.select().from(users).where(eq(users.slug, SYSTEM_SLUG));
  if (existing) await db.delete(users).where(eq(users.id, existing.id));
  const [system] = await db.insert(users).values({ slug: SYSTEM_SLUG }).returning();
  await insertStarterData(system.id);

  await insertSeedContent(system.id);

  console.log(`Seeded @${SYSTEM_SLUG}: ${SEED_PAGES.length} pages, ${SEED_CHATS.length} chats.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

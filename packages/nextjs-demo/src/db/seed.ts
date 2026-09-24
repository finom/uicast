import type { ComponentEntry, ValueSource } from "@uicast/core";
import * as catalogDefs from "@uicast/shadcn-catalog/all/defs";
import { and, eq, isNull, notInArray, or } from "drizzle-orm";
import { db } from "./index";
import { chats, componentEntries, pages, users } from "./schema";
import { insertSeedChats, SEED_CHATS, SEED_PAGES } from "./seed-content";
import { insertStarterData } from "./starter-data";
import { evaluator } from "@/lib/evaluator";
import { SYSTEM_SLUG } from "@/lib/system-slug";

// An existing account keeps its rows (pages by seed id, chats by id), and every link uses those ids, so links survive a reseed.
// `--fresh` recreates the account and its domain data.

const DEFS = new Map(Object.values(catalogDefs).map((def) => [def.name, def]));

// §1 tree, §4 scope names, §6 lists.
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
    if (e.props && "literal" in e.props) {
      const result = def.props["~standard"].validate(e.props.literal);
      if (result instanceof Promise) throw new Error(`[${where}] async props schema on ${e.component}`);
      if (result.issues) {
        throw new Error(`[${where}] "${e.key}" props do not match ${e.component}: ${result.issues.map((i) => i.message).join("; ")}`);
      }
    }
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
    const vs = (v: ValueSource | undefined) => {
      if (v && "expr" in v) exprs.push(v.expr);
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
      evaluator.validate(e);
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

async function updateSeedContent(userId: string): Promise<void> {
  for (const page of SEED_PAGES) {
    // A row seeded before `seed_id` existed matches by title once, so its row id survives too.
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(
        and(
          eq(pages.userId, userId),
          or(eq(pages.seedId, page.seedId), and(isNull(pages.seedId), eq(pages.title, page.title))),
        ),
      );
    const usage = page.usage ?? { inputTokens: 0, outputTokens: 0, costUsd: 0, model: null };
    const values = { userId, seedId: page.seedId, title: page.title, prompt: page.prompt, ...usage };
    const [row] = existing
      ? await db.update(pages).set(values).where(eq(pages.id, existing.id)).returning()
      : await db.insert(pages).values(values).returning();
    await db.delete(componentEntries).where(eq(componentEntries.pageId, row.id));
    await db.insert(componentEntries).values(page.entries.map((entry) => ({ pageId: row.id, data: entry })));
  }
  const seedIds = SEED_PAGES.map((page) => page.seedId);
  await db.delete(pages).where(and(eq(pages.userId, userId), or(isNull(pages.seedId), notInArray(pages.seedId, seedIds))));

  // Chat ids are fixed strings, so a rewrite keeps every chat link.
  await db.delete(chats).where(eq(chats.userId, userId));
  await insertSeedChats(userId);
}

async function main() {
  for (const page of SEED_PAGES) validateEntries(page.title, page.entries);
  validateFences();

  const [existing] = await db.select().from(users).where(eq(users.slug, SYSTEM_SLUG));
  if (existing && !process.argv.includes("--fresh")) {
    await updateSeedContent(existing.id);
    console.log(`Updated @${SYSTEM_SLUG}: ${SEED_PAGES.length} pages, ${SEED_CHATS.length} chats.`);
    process.exit(0);
  }
  if (existing) await db.delete(users).where(eq(users.id, existing.id));
  const [system] = await db.insert(users).values({ slug: SYSTEM_SLUG }).returning();
  await insertStarterData(system.id);
  await updateSeedContent(system.id);

  console.log(`Seeded @${SYSTEM_SLUG}: ${SEED_PAGES.length} pages, ${SEED_CHATS.length} chats.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

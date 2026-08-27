import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ComponentEntry } from "@uicast/core";

/**
 * The whole demo's persistence: one JSON file, read once and written on every
 * mutation. The sibling `nextjs-demo` runs on SQLite because it also models a
 * warehouse; this app's only domain is the MCP servers you connect, so a
 * database would be more machinery than subject.
 */

export type PageRow = {
  id: number;
  title: string;
  slug: string;
  icon: string | null;
  position: number;
  prompt: string | null;
  createdAt: number;
};

export type EntryRow = {
  id: number;
  pageId: number;
  data: ComponentEntry;
  createdAt: number;
};

export type ChatRow = { id: string; title: string; createdAt: number };

export type MessageRow = {
  id: number;
  chatId: string;
  messageId: string;
  role: string;
  parts: unknown;
  createdAt: number;
};

/**
 * A connected MCP server. `headers` covers servers that authenticate with a
 * static credential (`Authorization: Bearer …`, an API key header) — the case
 * the spec leaves to the host. Stored in plain text: this is a local demo, and
 * pretending otherwise would be theatre.
 */
export type ServerRow = {
  id: number;
  name: string;
  url: string;
  headers: Record<string, string>;
  createdAt: number;
};

type Data = {
  pages: PageRow[];
  entries: EntryRow[];
  chats: ChatRow[];
  messages: MessageRow[];
  servers: ServerRow[];
  nextId: number;
};

const EMPTY: Data = {
  pages: [],
  entries: [],
  chats: [],
  messages: [],
  servers: [],
  nextId: 1,
};

const FILE = process.env.STORE_PATH ?? "./data/store.json";

// One instance across dev hot-reloads — a fresh module evaluation must not
// resurrect state the previous one already wrote past.
const globalForStore = globalThis as unknown as { uicastStore?: Data };

function load(): Data {
  if (globalForStore.uicastStore) return globalForStore.uicastStore;
  let data = EMPTY;
  try {
    data = { ...EMPTY, ...JSON.parse(readFileSync(FILE, "utf8")) };
  } catch {
    // No file yet (or an unreadable one) — start empty and write on first use.
  }
  globalForStore.uicastStore = data;
  return data;
}

function flush(data: Data) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

/** Read the current data without writing. */
export function read(): Readonly<Data> {
  return load();
}

/**
 * Mutate and persist in one step. The callback gets the live object plus an
 * `id()` for the shared autoincrement counter, and whatever it returns is
 * returned to the caller — so a route reads as one expression.
 */
export function write<T>(fn: (data: Data, id: () => number) => T): T {
  const data = load();
  const result = fn(data, () => data.nextId++);
  flush(data);
  return result;
}

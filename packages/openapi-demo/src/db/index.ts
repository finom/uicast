import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Reuse one connection across dev hot-reloads instead of opening a new handle
// (and re-locking the file) on every module re-evaluation.
const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

const dbPath = process.env.DATABASE_PATH ?? "./data/app.db";
// better-sqlite3 will not create the directory, and a fresh checkout has none.
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = globalForDb.sqlite ?? new Database(dbPath);
if (!globalForDb.sqlite) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });

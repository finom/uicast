import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// One pool across dev hot-reloads. Works against docker-compose Postgres
// locally and a Neon pooled connection string in production.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgres://uicast:uicast@localhost:5432/uicast",
    max: 10,
  });
if (!globalForDb.pgPool) globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });

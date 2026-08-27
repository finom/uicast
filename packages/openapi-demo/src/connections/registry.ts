import { desc } from "drizzle-orm";
import type { StandardToolV0 } from "standard-tool";
import { db } from "@/db";
import { type Connection, connections } from "@/db/schema";
import { deriveConnectionTools } from "./derive";

/**
 * Every connected API, as host functions.
 *
 * Server-side only. A derived tool's `execute` performs the real HTTP call with
 * the connection's credential bound in, so it must never be constructed in the
 * browser — the client gets proxy tools of the same name instead.
 */

export type ConnectionFailure = { connectionId: number; name: string; error: string };

export type Registry = { tools: StandardToolV0[]; failures: ConnectionFailure[] };

/**
 * Derive tools for every connection, in parallel. A spec that will not fetch or
 * will not convert produces a failure entry rather than taking the others down
 * — a broken connection should not stop the model from using the working ones.
 */
export async function resolveRegistry(): Promise<Registry> {
  const rows = await db.select().from(connections).orderBy(desc(connections.createdAt));
  const results = await Promise.all(
    rows.map(async (connection: Connection) => {
      try {
        const { tools } = await deriveConnectionTools(connection);
        return { tools, failure: null };
      } catch (error) {
        return {
          tools: [] as StandardToolV0[],
          failure: {
            connectionId: connection.id,
            name: connection.name,
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    }),
  );

  return {
    tools: results.flatMap((result) => result.tools),
    failures: results.flatMap((result) => (result.failure ? [result.failure] : [])),
  };
}

/** Find one derived tool by the name an expression called. */
export async function findTool(name: string) {
  const { tools } = await resolveRegistry();
  return tools.find((tool) => tool.name === name) ?? null;
}

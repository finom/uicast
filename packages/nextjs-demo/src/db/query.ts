import { and, type Column, eq, getTableColumns, ilike, type SQLWrapper, sql, type Table } from "drizzle-orm";
import { db } from "./index";
import type { customers, products, suppliers } from "./schema";

export function publicColumns<T extends Table>(table: T): Omit<T["_"]["columns"], "userId"> {
  const { userId: _owner, ...columns } = getTableColumns(table) as T["_"]["columns"] & { userId?: Column };
  return columns;
}

// LIKE metacharacters in `q` are literal.
export const contains = (column: Column, q: string) => ilike(column, `%${q.replace(/[\\%_]/g, "\\$&")}%`);

// node-postgres returns SUM as a string.
export const sumOf = (expr: SQLWrapper) => sql<number>`coalesce(round(sum(${expr})::numeric, 2), 0)`.mapWith(Number);

// FKs are global, so a referenced row must also be checked as the caller's own.
export async function ownsRow(
  table: typeof customers | typeof products | typeof suppliers,
  id: number,
  userId: string,
) {
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)));
  return row !== undefined;
}

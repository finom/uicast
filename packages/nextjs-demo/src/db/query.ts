import { type Column, getTableColumns, ilike, type SQLWrapper, sql, type Table } from "drizzle-orm";

// Everything but the owner: what a row looks like over the API.
export function publicColumns<T extends Table>(table: T): Omit<T["_"]["columns"], "userId"> {
  const { userId: _owner, ...columns } = getTableColumns(table) as T["_"]["columns"] & { userId?: Column };
  return columns;
}

// Case-insensitive substring match; LIKE metacharacters in `q` are literal.
export const contains = (column: Column, q: string) => ilike(column, `%${q.replace(/[\\%_]/g, "\\$&")}%`);

// node-postgres returns SUM as a string; this is a number, rounded to cents, 0 with no rows.
export const sumOf = (expr: SQLWrapper) =>
  sql<number>`coalesce(round(sum(${expr})::numeric, 2), 0)`.mapWith(Number);

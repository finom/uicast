import { and, asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contains, publicColumns, sumOf } from "@/db/query";
import { customers, orders } from "@/db/schema";
import { customerInsert, customerListInput } from "@/db/zod";
import { json, ownerForRead, readQuery, readValid, requireUser } from "@/lib/api";

const COLS = publicColumns(customers);

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, customerListInput);
  if ("error" in input) return input.error;
  const { limit, offset, sort, order, q } = input.data;
  const dir = order === "asc" ? asc : desc;
  const where = and(
    eq(customers.userId, read.owner.id),
    q ? or(contains(customers.name, q), contains(customers.company, q)) : undefined,
  );
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        ...COLS,
        orders: count(orders.id).as("orders"),
        lifetime: sumOf(sql`case when ${orders.status} <> 'cancelled' then ${orders.total} end`).as("lifetime"),
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(where)
      .groupBy(customers.id)
      .orderBy((row) => [dir(row[sort]), dir(row.id)])
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(customers).where(where),
  ]);
  return json({ items, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, customerInsert);
  if ("error" in body) return body.error;
  const [row] = await db.insert(customers).values({ ...body.data, userId: auth.me.id }).returning(COLS);
  return json(row, 201);
}

import { and, asc, count, desc, eq, gte, or } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contains, ownsRow, publicColumns } from "@/db/query";
import { customers, orders, products } from "@/db/schema";
import { orderInsert, orderListInput } from "@/db/zod";
import { json, ownerForRead, readQuery, readValid, requireUser } from "@/lib/api";

const COLS = publicColumns(orders);

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, orderListInput);
  if ("error" in input) return input.error;
  const { limit, offset, sort, order, q, status, customerId, productId, minTotal, from, days } = input.data;
  const dir = order === "asc" ? asc : desc;
  const where = and(
    eq(orders.userId, read.owner.id),
    q ? or(contains(orders.productName, q), contains(customers.name, q)) : undefined,
    status ? eq(orders.status, status) : undefined,
    customerId !== undefined ? eq(orders.customerId, customerId) : undefined,
    productId !== undefined ? eq(orders.productId, productId) : undefined,
    minTotal !== undefined ? gte(orders.total, minTotal) : undefined,
    from ? gte(orders.createdAt, new Date(from)) : undefined,
    days !== undefined ? gte(orders.createdAt, new Date(Date.now() - days * 86_400_000)) : undefined,
  );
  const [items, [{ total }]] = await Promise.all([
    db
      .select({ ...COLS, customerName: customers.name })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(where)
      .orderBy((row) => [dir(row[sort]), dir(row.id)])
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(orders).innerJoin(customers, eq(customers.id, orders.customerId)).where(where),
  ]);
  return json({ items, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, orderInsert);
  if ("error" in body) return body.error;
  if (!(await ownsRow(customers, body.data.customerId, auth.me.id))) {
    return json({ error: "customerId does not exist" }, 400);
  }
  if (!(await ownsRow(products, body.data.productId, auth.me.id))) {
    return json({ error: "productId does not exist" }, 400);
  }
  const [row] = await db.insert(orders).values({ ...body.data, userId: auth.me.id }).returning(COLS);
  return json(row, 201);
}

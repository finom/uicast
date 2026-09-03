import { and, asc, count, desc, eq, gte, or } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contains, publicColumns } from "@/db/query";
import { customers, orders, products } from "@/db/schema";
import { orderInsert, orderListInput } from "@/db/zod";
import { json, ownerForRead, readQuery, readValid, requireUser } from "@/lib/api";

const COLS = publicColumns(orders);

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, orderListInput);
  if ("error" in input) return input.error;
  const { limit, offset, sort, order, q, status, customerId, productId, minTotal, from } = input.data;
  const dir = order === "asc" ? asc : desc;
  const where = and(
    eq(orders.userId, read.owner.id),
    q ? or(contains(orders.productName, q), contains(customers.name, q)) : undefined,
    status ? eq(orders.status, status) : undefined,
    customerId !== undefined ? eq(orders.customerId, customerId) : undefined,
    productId !== undefined ? eq(orders.productId, productId) : undefined,
    minTotal !== undefined ? gte(orders.total, minTotal) : undefined,
    from ? gte(orders.createdAt, new Date(from)) : undefined,
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
  // The referenced rows must be the caller's own — FKs alone are global.
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, body.data.customerId), eq(customers.userId, auth.me.id)));
  if (!customer) return json({ error: "customerId does not exist" }, 400);
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, body.data.productId), eq(products.userId, auth.me.id)));
  if (!product) return json({ error: "productId does not exist" }, 400);
  const [row] = await db
    .insert(orders)
    .values({ ...body.data, userId: auth.me.id })
    .returning(COLS);
  return json(row, 201);
}

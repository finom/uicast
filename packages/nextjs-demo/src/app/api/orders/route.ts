import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { customers, orders, products } from "@/db/schema";
import { orderInsert } from "@/db/zod";
import { json, ownerForRead, readValid, requireUser } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(await db.select({ id: orders.id, customerId: orders.customerId, productId: orders.productId, productName: orders.productName, qty: orders.qty, unitPrice: orders.unitPrice, total: orders.total, status: orders.status, createdAt: orders.createdAt }).from(orders).where(eq(orders.userId, read.owner.id)));
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
    .returning({ id: orders.id, customerId: orders.customerId, productId: orders.productId, productName: orders.productName, qty: orders.qty, unitPrice: orders.unitPrice, total: orders.total, status: orders.status, createdAt: orders.createdAt });
  return json(row, 201);
}

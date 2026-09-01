import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { orderUpdate } from "@/db/zod";
import { idParam, json, ownerForRead, readValid, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const id = await idParam(params);
  const [row] = await db
    .select({ id: orders.id, customerId: orders.customerId, productId: orders.productId, productName: orders.productName, qty: orders.qty, unitPrice: orders.unitPrice, total: orders.total, status: orders.status, createdAt: orders.createdAt })
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, read.owner.id)));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const body = await readValid(req, orderUpdate);
  if ("error" in body) return body.error;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(orders)
    .set(body.data)
    .where(and(eq(orders.id, id), eq(orders.userId, auth.me.id)))
    .returning({ id: orders.id, customerId: orders.customerId, productId: orders.productId, productName: orders.productName, qty: orders.qty, unitPrice: orders.unitPrice, total: orders.total, status: orders.status, createdAt: orders.createdAt });
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const [row] = await db
    .delete(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, auth.me.id)))
    .returning({ id: orders.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

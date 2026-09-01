import { and, count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { productUpdate } from "@/db/zod";
import { idParam, json, ownerForRead, readValid, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const id = await idParam(params);
  const [row] = await db
    .select({ id: products.id, supplierId: products.supplierId, name: products.name, sku: products.sku, category: products.category, stock: products.stock, price: products.price })
    .from(products)
    .where(and(eq(products.id, id), eq(products.userId, read.owner.id)));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const body = await readValid(req, productUpdate);
  if ("error" in body) return body.error;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(products)
    .set(body.data)
    .where(and(eq(products.id, id), eq(products.userId, auth.me.id)))
    .returning({ id: products.id, supplierId: products.supplierId, name: products.name, sku: products.sku, category: products.category, stock: products.stock, price: products.price });
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  // orders.productId is FK-restricted — surface a 409 instead of a raw
  // constraint failure.
  const [{ refs }] = await db
    .select({ refs: count() })
    .from(orders)
    .where(and(eq(orders.productId, id), eq(orders.userId, auth.me.id)));
  if (refs > 0) {
    return json({ error: `Cannot delete: ${refs} order(s) reference this product` }, 409);
  }
  const [row] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.userId, auth.me.id)))
    .returning({ id: products.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

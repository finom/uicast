import { count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { productUpdate } from "@/db/zod";
import { idParam, json, readValid } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db.select().from(products).where(eq(products.id, id));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, productUpdate);
  if ("error" in body) return body.error;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db.update(products).set(body.data).where(eq(products.id, id)).returning();
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  // orders.productId is FK-restricted — surface a 409 instead of letting the
  // delete die on the raw SQLite constraint failure.
  const [{ refs }] = await db
    .select({ refs: count() })
    .from(orders)
    .where(eq(orders.productId, id));
  if (refs > 0) {
    return json({ error: `Cannot delete: ${refs} order(s) reference this product` }, 409);
  }
  const [row] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

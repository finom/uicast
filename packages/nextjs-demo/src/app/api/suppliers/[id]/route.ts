import { and, count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { publicColumns } from "@/db/query";
import { products, suppliers } from "@/db/schema";
import { supplierUpdate } from "@/db/zod";
import { idParam, json, ownerForRead, readValid, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const COLS = publicColumns(suppliers);

export async function GET(req: NextRequest, { params }: Ctx) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const id = await idParam(params);
  const [row] = await db
    .select(COLS)
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, read.owner.id)));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const body = await readValid(req, supplierUpdate);
  if ("error" in body) return body.error;
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(suppliers)
    .set(body.data)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, auth.me.id)))
    .returning(COLS);
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const [{ refs }] = await db
    .select({ refs: count() })
    .from(products)
    .where(and(eq(products.supplierId, id), eq(products.userId, auth.me.id)));
  if (refs > 0) {
    return json({ error: `Cannot delete: ${refs} product(s) reference this supplier` }, 409);
  }
  const [row] = await db
    .delete(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, auth.me.id)))
    .returning({ id: suppliers.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

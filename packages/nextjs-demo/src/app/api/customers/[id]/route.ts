import { and, count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { publicColumns } from "@/db/query";
import { customers, orders } from "@/db/schema";
import { customerUpdate } from "@/db/zod";
import { idParam, json, ownerForRead, readValid, requireUser } from "@/lib/api";

type Ctx = RouteContext<"/api/customers/[id]">;

const COLS = publicColumns(customers);

export async function GET(req: NextRequest, { params }: Ctx) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const id = await idParam(params);
  const [row] = await db
    .select(COLS)
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.userId, read.owner.id)));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const body = await readValid(req, customerUpdate);
  if ("error" in body) return body.error;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(customers)
    .set(body.data)
    .where(and(eq(customers.id, id), eq(customers.userId, auth.me.id)))
    .returning(COLS);
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const [{ refs }] = await db
    .select({ refs: count() })
    .from(orders)
    .where(and(eq(orders.customerId, id), eq(orders.userId, auth.me.id)));
  if (refs > 0) {
    return json({ error: `Cannot delete: ${refs} order(s) reference this customer` }, 409);
  }
  const [row] = await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.userId, auth.me.id)))
    .returning({ id: customers.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

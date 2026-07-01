import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { customerUpdate } from "@/db/zod";
import { idParam, json, readValid } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db.select().from(customers).where(eq(customers.id, id));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, customerUpdate);
  if ("error" in body) return body.error;
  const [row] = await db.update(customers).set(body.data).where(eq(customers.id, id)).returning();
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

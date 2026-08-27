import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageUpdate } from "@/db/zod";
import { idParam, json, readValid } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db.select().from(pages).where(eq(pages.id, id));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, pageUpdate);
  if ("error" in body) return body.error;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db.update(pages).set(body.data).where(eq(pages.id, id)).returning();
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db.delete(pages).where(eq(pages.id, id)).returning({ id: pages.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

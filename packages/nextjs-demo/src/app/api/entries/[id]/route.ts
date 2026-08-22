import type { ComponentEntry } from "@uicast/core";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { componentEntries, type NewComponentEntryRow } from "@/db/schema";
import { entryUpdate } from "@/db/zod";
import { idParam, json, readValid } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db.select().from(componentEntries).where(eq(componentEntries.id, id));
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, entryUpdate);
  if ("error" in body) return body.error;
  const updates: Partial<NewComponentEntryRow> = {};
  if (body.data.pageId !== undefined) updates.pageId = body.data.pageId;
  if (body.data.parentId !== undefined) updates.parentId = body.data.parentId;
  if (body.data.data !== undefined) updates.data = body.data.data as ComponentEntry;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(updates).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(componentEntries)
    .set(updates)
    .where(eq(componentEntries.id, id))
    .returning();
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db
    .delete(componentEntries)
    .where(eq(componentEntries.id, id))
    .returning({ id: componentEntries.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

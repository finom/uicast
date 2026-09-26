import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageUpdate } from "@/db/zod";
import { idParam, json, readValid, requireUser } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/pages/[id]">) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const body = await readValid(req, pageUpdate);
  if ("error" in body) return body.error;
  // Every field is optional — an empty patch would render UPDATE with no SET.
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(pages)
    .set(body.data)
    .where(and(eq(pages.id, id), eq(pages.userId, auth.me.id)))
    .returning();
  return row ? json(row) : json({ error: "Not found" }, 404);
}

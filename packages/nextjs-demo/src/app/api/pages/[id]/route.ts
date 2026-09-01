import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pages, users } from "@/db/schema";
import { pageUpdate } from "@/db/zod";
import { idParam, json, readValid, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Pages are world-readable by id; the owner's slug rides along so the client
// can scope tool reads and show the read-only banner.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const [row] = await db
    .select({ page: pages, ownerSlug: users.slug })
    .from(pages)
    .innerJoin(users, eq(pages.userId, users.id))
    .where(eq(pages.id, id));
  return row ? json({ ...row.page, ownerSlug: row.ownerSlug }) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const body = await readValid(req, pageUpdate);
  if ("error" in body) return body.error;
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const [row] = await db
    .update(pages)
    .set(body.data)
    .where(and(eq(pages.id, id), eq(pages.userId, auth.me.id)))
    .returning();
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = await idParam(params);
  const [row] = await db
    .delete(pages)
    .where(and(eq(pages.id, id), eq(pages.userId, auth.me.id)))
    .returning({ id: pages.id });
  return row ? json({ id: row.id }) : json({ error: "Not found" }, 404);
}

import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageInsert } from "@/db/zod";
import { json, ownerForRead, readValid, requireUser } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(
    await db.select().from(pages).where(eq(pages.userId, read.owner.id)).orderBy(pages.id),
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, pageInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(pages)
    .values({ ...body.data, userId: auth.me.id })
    .returning();
  return json(row, 201);
}

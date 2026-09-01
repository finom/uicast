import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { supplierInsert } from "@/db/zod";
import { json, ownerForRead, readValid, requireUser } from "@/lib/api";

const COLS = {
  id: suppliers.id,
  name: suppliers.name,
  email: suppliers.email,
  category: suppliers.category,
  leadTimeDays: suppliers.leadTimeDays,
};

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(await db.select(COLS).from(suppliers).where(eq(suppliers.userId, read.owner.id)));
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, supplierInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(suppliers)
    .values({ ...body.data, userId: auth.me.id })
    .returning(COLS);
  return json(row, 201);
}

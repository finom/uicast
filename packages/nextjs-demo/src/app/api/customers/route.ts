import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { customerInsert } from "@/db/zod";
import { json, ownerForRead, readValid, requireUser } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(await db.select({ id: customers.id, name: customers.name, company: customers.company, email: customers.email, createdAt: customers.createdAt }).from(customers).where(eq(customers.userId, read.owner.id)));
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, customerInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(customers)
    .values({ ...body.data, userId: auth.me.id })
    .returning({ id: customers.id, name: customers.name, company: customers.company, email: customers.email, createdAt: customers.createdAt });
  return json(row, 201);
}

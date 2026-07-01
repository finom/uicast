import type { NextRequest } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { customerInsert } from "@/db/zod";
import { json, readValid } from "@/lib/api";

export async function GET() {
  return json(await db.select().from(customers));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, customerInsert);
  if ("error" in body) return body.error;
  const [row] = await db.insert(customers).values(body.data).returning();
  return json(row, 201);
}

import type { NextRequest } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { orderInsert } from "@/db/zod";
import { json, readValid } from "@/lib/api";

export async function GET() {
  return json(await db.select().from(orders));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, orderInsert);
  if ("error" in body) return body.error;
  const [row] = await db.insert(orders).values(body.data).returning();
  return json(row, 201);
}

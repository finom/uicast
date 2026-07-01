import type { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { productInsert } from "@/db/zod";
import { json, readValid } from "@/lib/api";

export async function GET() {
  return json(await db.select().from(products));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, productInsert);
  if ("error" in body) return body.error;
  const [row] = await db.insert(products).values(body.data).returning();
  return json(row, 201);
}

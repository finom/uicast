import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageInsert } from "@/db/zod";
import { json, readValid } from "@/lib/api";

export async function GET() {
  return json(await db.select().from(pages).orderBy(pages.position));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, pageInsert);
  if ("error" in body) return body.error;
  const [row] = await db.insert(pages).values(body.data).returning();
  return json(row, 201);
}

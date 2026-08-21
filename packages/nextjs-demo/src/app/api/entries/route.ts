import type { ComponentEntry } from "uicast";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { componentEntries } from "@/db/schema";
import { entryInsert } from "@/db/zod";
import { json, readValid } from "@/lib/api";

export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get("pageId");
  const rows = await db
    .select()
    .from(componentEntries)
    .where(pageId ? eq(componentEntries.pageId, Number(pageId)) : undefined)
    .orderBy(componentEntries.createdAt);
  return json(rows);
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, entryInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(componentEntries)
    .values({
      pageId: body.data.pageId,
      parentId: body.data.parentId ?? null,
      data: body.data.data as ComponentEntry,
    })
    .returning();
  return json(row, 201);
}

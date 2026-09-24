import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { json, ownerForRead } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(
    await db.select().from(chats).where(eq(chats.userId, read.owner.id)).orderBy(desc(chats.createdAt)),
  );
}

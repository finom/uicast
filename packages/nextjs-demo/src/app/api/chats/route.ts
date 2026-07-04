import { desc } from "drizzle-orm";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { json } from "@/lib/api";

export async function GET() {
  return json(await db.select().from(chats).orderBy(desc(chats.createdAt)));
}

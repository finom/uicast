import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageInsert } from "@/db/zod";
import { json, readValid } from "@/lib/api";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "page"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET() {
  return json(await db.select().from(pages).orderBy(pages.position));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, pageInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(pages)
    .values({ ...body.data, slug: body.data.slug ?? slugify(body.data.title) })
    .returning();
  return json(row, 201);
}

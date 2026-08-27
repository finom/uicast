import type { NextRequest } from "next/server";
import { json, readValid } from "@/lib/api";
import { pageInsert } from "@/lib/schemas";
import { type PageRow, read, write } from "@/store";

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "page"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET() {
  return json([...read().pages].sort((a, b) => a.position - b.position));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, pageInsert);
  if ("error" in body) return body.error;
  const row = write((data, id): PageRow => {
    const page: PageRow = {
      id: id(),
      title: body.data.title,
      slug: body.data.slug ?? slugify(body.data.title),
      icon: body.data.icon ?? null,
      position: body.data.position ?? data.pages.length,
      prompt: body.data.prompt ?? null,
      createdAt: Date.now(),
    };
    data.pages.push(page);
    return page;
  });
  return json(row, 201);
}

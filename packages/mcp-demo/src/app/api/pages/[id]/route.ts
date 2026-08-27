import type { NextRequest } from "next/server";
import { idParam, json, readValid } from "@/lib/api";
import { pageUpdate } from "@/lib/schemas";
import { read, write } from "@/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const row = read().pages.find((page) => page.id === id);
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, pageUpdate);
  if ("error" in body) return body.error;
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const row = write((data) => {
    const page = data.pages.find((candidate) => candidate.id === id);
    if (page) Object.assign(page, body.data);
    return page;
  });
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const removed = write((data) => {
    const index = data.pages.findIndex((page) => page.id === id);
    if (index === -1) return false;
    data.pages.splice(index, 1);
    // Entries are owned by their page — the SQLite version does this with
    // `onDelete: "cascade"`.
    data.entries = data.entries.filter((entry) => entry.pageId !== id);
    return true;
  });
  return removed ? json({ id }) : json({ error: "Not found" }, 404);
}

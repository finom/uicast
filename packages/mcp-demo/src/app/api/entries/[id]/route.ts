import type { ComponentEntry } from "@uicast/core";
import type { NextRequest } from "next/server";
import { idParam, json, readValid } from "@/lib/api";
import { entryUpdate } from "@/lib/schemas";
import { read, write } from "@/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const row = read().entries.find((entry) => entry.id === id);
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, entryUpdate);
  if ("error" in body) return body.error;
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const row = write((data) => {
    const entry = data.entries.find((candidate) => candidate.id === id);
    if (!entry) return undefined;
    if (body.data.pageId !== undefined) entry.pageId = body.data.pageId;
    if (body.data.data !== undefined) entry.data = body.data.data as ComponentEntry;
    return entry;
  });
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const removed = write((data) => {
    const index = data.entries.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    data.entries.splice(index, 1);
    return true;
  });
  return removed ? json({ id }) : json({ error: "Not found" }, 404);
}

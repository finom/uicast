import type { ComponentEntry } from "@uicast/core";
import type { NextRequest } from "next/server";
import { json, readValid } from "@/lib/api";
import { entryInsert } from "@/lib/schemas";
import { type EntryRow, read, write } from "@/store";

export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get("pageId");
  const rows = read().entries.filter(
    (entry) => pageId === null || entry.pageId === Number(pageId),
  );
  return json([...rows].sort((a, b) => a.id - b.id));
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, entryInsert);
  if ("error" in body) return body.error;
  const row = write((data, id): EntryRow => {
    const entry: EntryRow = {
      id: id(),
      pageId: body.data.pageId,
      data: body.data.data as ComponentEntry,
      createdAt: Date.now(),
    };
    data.entries.push(entry);
    return entry;
  });
  return json(row, 201);
}

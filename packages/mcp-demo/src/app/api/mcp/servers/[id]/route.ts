import type { NextRequest } from "next/server";
import { idParam, json, readValid } from "@/lib/api";
import { serverUpdate } from "@/lib/schemas";
import { disconnect } from "@/mcp/client";
import { read, write } from "@/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const row = read().servers.find((server) => server.id === id);
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const body = await readValid(req, serverUpdate);
  if ("error" in body) return body.error;
  if (Object.keys(body.data).length === 0) return json({ error: "No fields to update" }, 400);
  const row = write((data) => {
    const server = data.servers.find((candidate) => candidate.id === id);
    if (server) Object.assign(server, body.data);
    return server;
  });
  // The cached connection carries the old URL and credentials.
  await disconnect(id);
  return row ? json(row) : json({ error: "Not found" }, 404);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = await idParam(params);
  const removed = write((data) => {
    const index = data.servers.findIndex((server) => server.id === id);
    if (index === -1) return false;
    data.servers.splice(index, 1);
    return true;
  });
  await disconnect(id);
  return removed ? json({ id }) : json({ error: "Not found" }, 404);
}

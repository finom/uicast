import type { NextRequest } from "next/server";
import { json, readValid } from "@/lib/api";
import { serverInsert } from "@/lib/schemas";
import { read, type ServerRow, write } from "@/store";

export const runtime = "nodejs";

export async function GET() {
  return json(read().servers);
}

export async function POST(req: NextRequest) {
  const body = await readValid(req, serverInsert);
  if ("error" in body) return body.error;
  const row = write((data, id): ServerRow => {
    const server: ServerRow = {
      id: id(),
      name: body.data.name,
      url: body.data.url,
      headers: body.data.headers ?? {},
      createdAt: Date.now(),
    };
    data.servers.push(server);
    return server;
  });
  return json(row, 201);
}

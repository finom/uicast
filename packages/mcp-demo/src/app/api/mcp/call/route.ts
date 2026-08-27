import type { NextRequest } from "next/server";
import { json, readValid } from "@/lib/api";
import { toolCall } from "@/lib/schemas";
import { callTool } from "@/mcp/client";
import { findTool } from "@/mcp/registry";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * The browser's door to an MCP server. A generated document's expressions run
 * client-side, so its host functions post here instead of speaking MCP
 * themselves — which keeps every server credential on this side of the wire.
 */
export async function POST(req: NextRequest) {
  const body = await readValid(req, toolCall);
  if ("error" in body) return body.error;

  const found = await findTool(body.data.callName);
  if (!found) return json({ error: `No connected tool named ${body.data.callName}` }, 404);

  try {
    const result = await callTool(found.server, found.resolved.toolName, body.data.input);
    return json({ result });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 502);
  }
}

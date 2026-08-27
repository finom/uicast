import { json } from "@/lib/api";
import { resolveRegistry } from "@/mcp/registry";

export const runtime = "nodejs";

/**
 * What every connected server currently exposes. Both consumers read this: the
 * MCPs screen, which shows it as a table, and the browser's renderer, which
 * turns each entry into a callable host function.
 */
export async function GET() {
  const registry = await resolveRegistry();
  return json({
    tools: registry.tools.map((resolved) => ({
      serverId: resolved.serverId,
      serverName: resolved.serverName,
      toolName: resolved.toolName,
      callName: resolved.callName,
      title: resolved.tool.title ?? null,
      description: resolved.tool.description ?? null,
      inputSchema: resolved.tool.inputSchema ?? null,
      outputSchema: resolved.tool.outputSchema ?? null,
    })),
    failures: registry.failures,
  });
}

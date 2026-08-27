import type { StandardToolV0 } from "standard-tool";
import { read, type ServerRow } from "@/store";
import { callTool, listTools } from "./client";
import { expressionName, type ResolvedTool, toStandardTool } from "./standard-tool";
import { ajvValidator } from "./validator";

/**
 * Every connected server's tools, resolved into the one shape the rest of the
 * app deals in. This is the layer that makes "connect an MCP server" equal
 * "extend what the model can build with".
 */

export type ServerFailure = { serverId: number; serverName: string; error: string };

export type Registry = { tools: ResolvedTool[]; failures: ServerFailure[] };

/**
 * List every server in parallel. A server that is unreachable, unauthorized, or
 * simply broken produces a failure entry rather than taking the others down —
 * and a tool the model cannot reach is better excluded from the prompt than
 * offered and then unavailable at render time.
 */
export async function resolveRegistry(): Promise<Registry> {
  const servers = read().servers;
  const results = await Promise.all(
    servers.map(async (server: ServerRow) => {
      try {
        const tools = await listTools(server);
        return {
          tools: tools.map(
            (tool): ResolvedTool => ({
              serverId: server.id,
              serverName: server.name,
              toolName: tool.name,
              callName: expressionName(server.name, tool.name),
              tool: {
                name: tool.name,
                title: tool.title,
                description: tool.description,
                inputSchema: tool.inputSchema as Record<string, unknown> | undefined,
                outputSchema: tool.outputSchema as Record<string, unknown> | undefined,
              },
            }),
          ),
          failure: null,
        };
      } catch (error) {
        return {
          tools: [],
          failure: {
            serverId: server.id,
            serverName: server.name,
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    }),
  );

  return {
    tools: results.flatMap((result) => result.tools),
    failures: results.flatMap((result) => (result.failure ? [result.failure] : [])),
  };
}

/**
 * The registry as uicast host functions, for the prompt builders. `execute`
 * speaks MCP directly because this only ever runs on the server; the browser
 * gets its own set, wired through `/api/mcp/call`.
 */
export function toPromptTools(registry: Registry): StandardToolV0[] {
  const servers = read().servers;
  return registry.tools.map((resolved) =>
    toStandardTool(resolved, async (input) => {
      const server = servers.find((candidate) => candidate.id === resolved.serverId);
      if (!server) throw new Error(`Server ${resolved.serverName} is no longer connected.`);
      return callTool(server, resolved.toolName, input);
    }, ajvValidator),
  );
}

/** Resolve the identifier an expression called back to a real server + tool. */
export async function findTool(callName: string) {
  const registry = await resolveRegistry();
  const resolved = registry.tools.find((tool) => tool.callName === callName);
  if (!resolved) return null;
  const server = read().servers.find((candidate) => candidate.id === resolved.serverId);
  return server ? { resolved, server } : null;
}

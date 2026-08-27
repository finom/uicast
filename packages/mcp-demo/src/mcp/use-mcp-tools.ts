"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { StandardToolV0 } from "standard-tool";
import type { ServerFailure } from "./registry";
import { type ResolvedTool, toStandardTool } from "./standard-tool";

/**
 * The browser's view of every connected server's tools — the same registry the
 * prompt is built from, fetched over HTTP.
 *
 * The `functions` it returns are real `StandardToolV0`s, so they satisfy
 * `RendererProvider` and the prompt builders alike; only `execute` differs from
 * the server-side set, posting to `/api/mcp/call` instead of speaking MCP.
 * A generated document therefore never learns a server's URL or credentials.
 */

export type ToolInfo = {
  serverId: number;
  serverName: string;
  toolName: string;
  callName: string;
  title: string | null;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
};

type Payload = { tools: ToolInfo[]; failures: ServerFailure[] };

async function callViaProxy(callName: string, input: unknown): Promise<unknown> {
  const res = await fetch("/api/mcp/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callName, input }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `${callName} failed (${res.status})`);
  return body.result;
}

export function useMcpTools() {
  const query = useQuery({
    queryKey: ["mcp-tools"],
    queryFn: async (): Promise<Payload> => {
      const res = await fetch("/api/mcp/tools");
      if (!res.ok) throw new Error(`Could not list MCP tools (${res.status})`);
      return res.json();
    },
  });

  const tools = useMemo(() => query.data?.tools ?? [], [query.data]);

  const functions = useMemo<StandardToolV0[]>(
    () =>
      tools.map((info) => {
        const resolved: ResolvedTool = {
          serverId: info.serverId,
          serverName: info.serverName,
          toolName: info.toolName,
          callName: info.callName,
          tool: {
            name: info.toolName,
            title: info.title ?? undefined,
            description: info.description ?? undefined,
            inputSchema: info.inputSchema ?? undefined,
            outputSchema: info.outputSchema ?? undefined,
          },
        };
        return toStandardTool(resolved, (input) => callViaProxy(info.callName, input));
      }),
    [tools],
  );

  return {
    functions,
    tools,
    failures: query.data?.failures ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { standardTool, type StandardToolV0 } from "standard-tool";
import { z } from "zod";

/**
 * The host functions a generated document can call.
 *
 * Two kinds, and the split is the whole design:
 *
 * - `saveConnection`, which the model calls from the connection form it draws.
 *   The credential goes straight from the form into this call and on to the
 *   server; it is never read back, so nothing returns it to the document.
 * - one proxy per operation of every connected API. They carry the real name
 *   and the real schemas — so the prompt and the runtime agree — but `execute`
 *   posts to this app's own route instead of calling the API. The credential
 *   stays server-side.
 */

type ToolInfo = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
};

/**
 * Wrap a raw JSON Schema as what `StandardToolV0` wants in a schema slot:
 * `StandardSchemaV1 & StandardJSONSchemaV1`, both under one `~standard` key.
 * `jsonSchema` is a pass-through — the schema the server derived is the schema
 * the model reads. `validate` accepts: the server validates for real, and the
 * browser half would only be duplicating it into the bundle.
 */
function passthroughSchema(schema: Record<string, unknown>) {
  const emit = (options: { target: string }) => {
    if (options.target !== "draft-2020-12") {
      throw new Error(`Only draft-2020-12 is emitted, not ${options.target}`);
    }
    return schema;
  };
  return {
    "~standard": {
      version: 1 as const,
      vendor: "openapi",
      validate: (value: unknown) => ({ value }),
      jsonSchema: { input: emit, output: emit },
    },
  };
}

async function callTool(name: string, input: unknown): Promise<unknown> {
  const res = await fetch("/api/tools/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, input }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? body?.error ?? `${name} failed (${res.status})`);
  return body.result;
}

export function useConnectionFunctions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["connection-tools"],
    queryFn: async (): Promise<{ tools: ToolInfo[] }> => {
      const res = await fetch("/api/tools");
      if (!res.ok) throw new Error(`Could not list connected operations (${res.status})`);
      return res.json();
    },
  });

  const tools = useMemo(() => query.data?.tools ?? [], [query.data]);

  const functions = useMemo<StandardToolV0[]>(() => {
    const saveConnection = standardTool({
      name: "saveConnection",
      description:
        "Connect an API so its operations become callable. Call this from the Save button of a connection form, with the values the user typed.",
      inputSchema: z.object({
        name: z
          .string()
          .regex(/^[A-Za-z][A-Za-z0-9_]*$/)
          .meta({ description: "Short identifier for the API, e.g. `stripe`. Prefixes its operations." }),
        openapiUrl: z.string().meta({ description: "URL of the API's OpenAPI document." }),
        authType: z
          .enum(["none", "header", "query"])
          .meta({ description: "How the credential travels with each request." }),
        authName: z
          .string()
          .nullish()
          .meta({ description: "Header or query parameter name, e.g. `Authorization`." }),
        authPrefix: z
          .string()
          .nullish()
          .meta({ description: "Prepended to the credential, e.g. `Bearer `." }),
        credential: z
          .string()
          .nullish()
          .meta({ description: "The key the user pasted. Write it straight from the input; never store it in a scope." }),
      }),
      outputSchema: z.object({
        id: z.number().int(),
        name: z.string(),
        operations: z.array(z.string()).meta({
          description:
            "The operations this API now exposes. They become callable functions on the NEXT turn, not this one.",
        }),
      }),
      execute: async (input) => {
        const res = await fetch("/api/connections", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        const body = await res.json().catch(() => null);
        // The message matters: the server rejects a document it could not read,
        // so this is how the model learns its recalled URL was wrong and can
        // offer a corrected one in the same turn.
        if (!res.ok) throw new Error(body?.message ?? `Could not connect the API (${res.status})`);
        // The new API's operations become callable on the next render.
        queryClient.invalidateQueries({ queryKey: ["connection-tools"] });
        queryClient.invalidateQueries({ queryKey: ["connections"] });
        return { id: body.id, name: body.name, operations: body.operations ?? [] };
      },
    }) as StandardToolV0;

    const proxies = tools.map(
      (tool): StandardToolV0 =>
        ({
          name: tool.name,
          description: tool.description,
          ...(tool.inputSchema ? { inputSchema: passthroughSchema(tool.inputSchema) } : {}),
          ...(tool.outputSchema ? { outputSchema: passthroughSchema(tool.outputSchema) } : {}),
          execute: (input: unknown) => callTool(tool.name, input),
        }) as StandardToolV0,
    );

    return [saveConnection, ...proxies];
  }, [tools, queryClient]);

  return { functions, tools, isLoading: query.isLoading };
}

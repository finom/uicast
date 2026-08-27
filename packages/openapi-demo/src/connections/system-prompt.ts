import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getExpressionsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { allDefinitions } from "@uicast/shadcn-catalog/defs";
import { allCommonEventSchemas } from "@uicast/shadcn-catalog/events";
import { desc } from "drizzle-orm";
import type { StandardToolV0 } from "standard-tool";
import { z } from "zod";
import { db } from "@/db";
import { connections } from "@/db/schema";
import { getConnectionsPartialPrompt } from "./prompt";
import { resolveRegistry } from "./registry";

/**
 * The system prompt both surfaces share.
 *
 * The functions half is entirely whatever the user has connected — plus
 * `saveConnection`, which is how they connect anything in the first place. It
 * is declared here rather than imported from the client hook so the prompt and
 * the browser's copy stay one description apart, not one implementation apart.
 */
const saveConnectionSpec: StandardToolV0 = {
  name: "saveConnection",
  description:
    "Connect an API so its operations become callable. Call this from the Save button of a connection form, with the values the user typed.",
  inputSchema: z.object({
    name: z
      .string()
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
    credential: z.string().nullish().meta({ description: "The key the user pasted." }),
  }) as StandardToolV0["inputSchema"],
  outputSchema: z.object({
    id: z.number().int(),
    name: z.string(),
    operations: z.array(z.string()).meta({
      description:
        "The operations this API now exposes. They become callable functions on the NEXT turn, not this one.",
    }),
  }) as StandardToolV0["outputSchema"],
  // Never runs here: the prompt only reads its name, description and schemas.
  execute: () => {
    throw new Error("saveConnection runs in the browser");
  },
};

export async function buildSystemPrompt({
  scopeKind,
  extra = [],
}: {
  scopeKind: "page" | "answer";
  extra?: string[];
}): Promise<string> {
  const [rows, registry] = await Promise.all([
    db.select().from(connections).orderBy(desc(connections.createdAt)),
    resolveRegistry(),
  ]);

  return [
    getCommonInstructionsPartialPrompt(),
    getScopePartialPrompt({ kind: scopeKind }),
    getExpressionsPartialPrompt(),
    getComponentsPartialPrompt({
      definitions: allDefinitions,
      commonEvents: allCommonEventSchemas,
    }),
    getFunctionsPartialPrompt({ functions: [saveConnectionSpec, ...registry.tools] }),
    getConnectionsPartialPrompt({
      connected: rows.map((row) => ({
        name: row.name,
        openapiUrl: row.openapiUrl,
        configured: Boolean(row.credential),
        // A connection whose spec stopped loading is worth telling the model
        // about: it can offer to reconnect with a corrected URL.
        error: registry.failures.find((failure) => failure.name === row.name)?.error ?? null,
      })),
    }),
    ...extra,
  ].join("\n\n");
}

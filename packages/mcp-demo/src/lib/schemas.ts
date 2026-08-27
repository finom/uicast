import { z } from "zod";

// Request-body schemas for this app's own routes. Nothing here reaches the
// model — the functions it can call all come from connected MCP servers.

export const pageInsert = z.object({
  title: z.string().min(1),
  // Generated from the title by POST /api/pages when omitted.
  slug: z.string().optional(),
  icon: z.string().nullish(),
  position: z.number().int().optional(),
  prompt: z.string().nullish(),
});
export const pageUpdate = pageInsert.partial();

export const entryInsert = z.object({
  pageId: z.number().int(),
  data: z.unknown(),
});
export const entryUpdate = entryInsert.partial();

export const serverInsert = z.object({
  name: z.string().min(1).max(60),
  url: z.string().url(),
  // Static credentials for servers that authenticate with a header rather than
  // the spec's OAuth flow — `{ "Authorization": "Bearer …" }`.
  headers: z.record(z.string(), z.string()).optional(),
});
export const serverUpdate = serverInsert.partial();

export const toolCall = z.object({
  /** The identifier the expression used — server-prefixed, identifier-safe. */
  callName: z.string().min(1),
  input: z.unknown(),
});

import { z } from "zod";

// Zod companions for the Drizzle tables — route validation only. Nothing here
// reaches the model: the functions it can call are derived from the OpenAPI
// documents of the APIs the user connected.

// ---- pages (no tools; route validation only) ----
export const pageInsert = z.object({
  title: z.string().min(1),
  // Generated from the title by POST /api/pages when omitted.
  slug: z.string().optional(),
  icon: z.string().nullish(),
  position: z.number().int().optional(),
  prompt: z.string().nullish(),
});
export const pageUpdate = pageInsert.partial();

// ---- component entries (no tools; route validation only) ----
export const entryInsert = z.object({
  pageId: z.number().int(),
  parentId: z.number().int().nullish(),
  data: z.unknown(),
});
export const entryUpdate = entryInsert.partial();

// ---- connections ----
export const connectionInsert = z.object({
  // Prefixes derived tool names, which expressions call as bare identifiers, so
  // it has to survive as one.
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Letters, digits and underscores, starting with a letter"),
  openapiUrl: z.string().url(),
  authType: z.enum(["none", "header", "query"]).default("none"),
  authName: z.string().nullish(),
  authPrefix: z.string().nullish(),
  credential: z.string().nullish(),
});
export const connectionUpdate = connectionInsert.partial();

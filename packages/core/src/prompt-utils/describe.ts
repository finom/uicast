import type { JSONSchema } from "./json-schema-to-ts";

/**
 * The prompt's description convention: a type, then ` — description`.
 * `dashTail` renders the tail (empty when there is nothing to say).
 */
export const dashTail = (description: string | undefined): string =>
	description ? ` — ${description}` : "";

/**
 * The builders print a node's own description after an em-dash, so drop it
 * from the schema before type rendering — otherwise `JSONSchemaToTs` (which
 * annotates described nodes inline) would say it twice. Only the ROOT is
 * stripped: descriptions nested inside the type still render as inline
 * comments, which is the only place they can appear.
 */
export const stripRootDescription = (jsonSchema: unknown): unknown =>
	jsonSchema !== null && typeof jsonSchema === "object"
		? { ...(jsonSchema as JSONSchema), description: undefined }
		: jsonSchema;

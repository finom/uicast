import type { JSONSchema } from "./json-schema-to-ts";

/**
 * The prompt's description convention: a type, then ` — description`.
 * `dashTail` renders the tail (empty when there is nothing to say).
 */
export const dashTail = (description: string | undefined): string =>
	description ? ` — ${description}` : "";

/** Strip the ROOT description and default before type rendering — the builder prints them itself (` = default — description`). Nested ones still render inline. */
export const stripRootAnnotations = (jsonSchema: unknown): unknown =>
	jsonSchema !== null && typeof jsonSchema === "object"
		? { ...(jsonSchema as JSONSchema), description: undefined, default: undefined }
		: jsonSchema;

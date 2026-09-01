import type { JSONSchema } from "./json-schema-to-ts";

/**
 * The prompt's description convention: a type, then ` — description`.
 * `dashTail` renders the tail (empty when there is nothing to say).
 */
export const dashTail = (description: string | undefined): string =>
	description ? ` — ${description}` : "";

/** Strip the ROOT description before type rendering — the builder already prints it after an em-dash. Nested descriptions still render inline. */
export const stripRootDescription = (jsonSchema: unknown): unknown =>
	jsonSchema !== null && typeof jsonSchema === "object"
		? { ...(jsonSchema as JSONSchema), description: undefined }
		: jsonSchema;

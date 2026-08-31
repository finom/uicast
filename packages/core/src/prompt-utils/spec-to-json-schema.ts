import type { CombinedSpec } from "../types";
import type { JSONSchema } from "./json-schema-to-ts";

/**
 * A spec's JSON Schema for the prompt — the one home for the Standard JSON
 * Schema incantation, typed so callers don't cast.
 */
export const specToJSONSchema = (spec: CombinedSpec): JSONSchema =>
	spec["~standard"].jsonSchema.input({ target: "draft-2020-12" }) as JSONSchema;

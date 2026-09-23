import type { CombinedSpec } from "../types";
import type { JSONSchema } from "./json-schema-to-ts";

export const specToJSONSchema = (spec: CombinedSpec): JSONSchema =>
	spec["~standard"].jsonSchema.input({ target: "draft-2020-12" }) as JSONSchema;

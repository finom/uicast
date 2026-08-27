import Ajv2020 from "ajv/dist/2020";
import type { SchemaValidator } from "./standard-tool";

// Server-only. Kept apart from `standard-tool.ts` so the browser bundle, which
// needs the schemas for the prompt preview but never validates against them,
// doesn't carry a validator it will not run.

const ajv = new Ajv2020({
  strict: false, // MCP schemas are written for models, not for a validator.
  allErrors: true,
  // A tool's schema may reference a `$defs` entry it never defines — that is
  // the server's bug, and refusing to compile would take the whole tool out.
  validateSchema: false,
});

const cache = new WeakMap<object, ReturnType<typeof ajv.compile> | null>();

export const ajvValidator: SchemaValidator = (schema, value) => {
  let check = cache.get(schema);
  if (check === undefined) {
    try {
      check = ajv.compile(schema);
    } catch {
      check = null; // Uncompilable schema — accept rather than block the tool.
    }
    cache.set(schema, check);
  }
  if (!check || check(value)) return { ok: true };
  return {
    ok: false,
    issues: (check.errors ?? []).map((error) => ({
      message: `${error.instancePath || "input"} ${error.message ?? "is invalid"}`.trim(),
      path: error.instancePath.split("/").filter(Boolean),
    })),
  };
};

import type { StandardToolV0 } from "standard-tool";

/**
 * The MCP → uicast seam.
 *
 * uicast's only contract for a host function is `StandardToolV0`: a name, a
 * description, and optional input/output schemas that are simultaneously a
 * runtime validator (`StandardSchemaV1`) and emittable as JSON Schema
 * (`StandardJSONSchemaV1`). An MCP tool already carries a name, a description
 * and JSON Schemas — so the conversion is a wrapper, not a translation.
 */

/** The fields of an MCP `tools/list` entry this app reads. */
export type McpTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

/** An MCP tool plus the server it came from and the name expressions call it by. */
export type ResolvedTool = {
  serverId: number;
  serverName: string;
  /** The tool's real name on the server — what `tools/call` is given. */
  toolName: string;
  /** The identifier a uicast expression calls. See `expressionName`. */
  callName: string;
  tool: McpTool;
};

/**
 * Checks a value against a JSON Schema. Injected rather than imported so the
 * browser half of the app doesn't pull a validator into its bundle for a method
 * it never calls — see `validator.ts`, and `toolsForRenderer` for the side that
 * goes without.
 */
export type SchemaValidator = (
  schema: Record<string, unknown>,
  value: unknown,
) => { ok: true } | { ok: false; issues: { message: string; path: string[] }[] };

/**
 * MCP allows `.` and `-` in a tool name (`admin.tools.list`, `search-issues`),
 * and uicast expressions call a function by bare identifier — an expression
 * compiled with `search-issues` in scope is a syntax error, not a lookup
 * failure. So the name is made identifier-safe, and prefixed with the server so
 * two servers can both expose `search`.
 */
export function expressionName(serverName: string, toolName: string): string {
  const clean = (value: string) => value.replace(/[^A-Za-z0-9_]/g, "_");
  const prefix = clean(serverName).replace(/^(\d)/, "_$1");
  return `${prefix}_${clean(toolName)}`;
}

/**
 * Wrap a raw JSON Schema as the thing `StandardToolV0` wants in a schema slot:
 * `StandardSchemaV1 & StandardJSONSchemaV1`. Both live under one `~standard`
 * key, so a single object satisfies the intersection.
 *
 * `jsonSchema.input` is a pass-through: MCP schemas already default to
 * draft-2020-12, which is exactly the target uicast's prompt builder asks for.
 * Nothing is converted; the schema the server published is the schema the model
 * reads.
 */
export function mcpSchema(
  schema: Record<string, unknown>,
  validator?: SchemaValidator,
) {
  return {
    "~standard": {
      version: 1 as const,
      vendor: "mcp",
      // With no validator this accepts everything. That is not a shortcut: the
      // schema still reaches the model through `jsonSchema` below, which is the
      // half uicast actually reads, and the checking half runs on the server
      // where the call is made.
      validate: (value: unknown) => {
        if (!validator) return { value };
        const result = validator(schema, value);
        if (result.ok) return { value };
        return {
          issues: result.issues.map((issue) => ({
            message: issue.message,
            path: issue.path.map((key) => ({ key })),
          })),
        };
      },
      jsonSchema: {
        input: (options: { target: string }) => {
          if (options.target !== "draft-2020-12") {
            throw new Error(`mcpSchema only emits draft-2020-12, not ${options.target}`);
          }
          return schema;
        },
        output: (options: { target: string }) => {
          if (options.target !== "draft-2020-12") {
            throw new Error(`mcpSchema only emits draft-2020-12, not ${options.target}`);
          }
          return schema;
        },
      },
    },
  };
}

/** Does this schema describe any field at all, or is it an empty object shape? */
const hasFields = (schema: Record<string, unknown> | undefined): boolean => {
  if (!schema) return false;
  const properties = schema.properties as Record<string, unknown> | undefined;
  return Boolean(properties && Object.keys(properties).length > 0);
};

/**
 * One MCP tool as a uicast host function. `execute` is supplied by the caller
 * because the two sides of the app call the server differently: on the server
 * it speaks MCP directly, in the browser it posts to this app's own route so
 * the server's credentials never reach client code.
 */
export function toStandardTool(
  resolved: ResolvedTool,
  execute: (input: unknown) => Promise<unknown>,
  validator?: SchemaValidator,
): StandardToolV0 {
  const { tool, callName, serverName } = resolved;
  return {
    name: callName,
    title: tool.title,
    // The model picks a function by its description, and a tool's own text
    // rarely says which system it belongs to once several servers are mixed.
    description: `[${serverName}] ${tool.description ?? tool.title ?? tool.name}`,
    // MCP requires an `inputSchema` even for a zero-argument tool, where it is
    // an object with no properties. Passing that through would advertise
    // `name({ [key: string]: unknown })`; dropping it renders `name()`, which
    // is what the contract tells the model a no-input function looks like.
    ...(hasFields(tool.inputSchema)
      ? { inputSchema: mcpSchema(tool.inputSchema as Record<string, unknown>, validator) }
      : {}),
    ...(tool.outputSchema
      ? { outputSchema: mcpSchema(tool.outputSchema, validator) }
      : {}),
    execute,
  } as StandardToolV0;
}

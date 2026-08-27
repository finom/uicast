import type { StandardToolV0 } from "standard-tool";
import { openAPIToVovkSchema, reattachMixinDefs } from "vovk/internal";
import { createRPC } from "vovk/create-rpc";
import { deriveTools } from "vovk";
import type { Connection } from "@/db/schema";

/**
 * A connected API becomes host functions, at runtime, with no codegen.
 *
 *   OpenAPI document
 *     -> openAPIToVovkSchema   a Vovk segment schema, built in memory
 *     -> createRPC             callable handlers that perform the real fetch
 *     -> withDefaults          the credential bound in, once, per connection
 *     -> deriveTools           StandardToolV0[], which is all uicast consumes
 *
 * The credential is bound to the module rather than passed per call: a derived
 * tool's `execute` only accepts `{ body, query, params }`, so there is no
 * channel for it in the call itself.
 */

type JSONSchema = Record<string, unknown>;

type Segment = {
  segmentType?: string;
  segmentName: string;
  meta?: { openAPIObject?: { components?: unknown } };
  controllers?: Record<
    string,
    { handlers?: Record<string, { validation?: Record<string, JSONSchema | undefined> }> }
  >;
};

type DerivedConnection = {
  connection: Connection;
  tools: StandardToolV0[];
};

/** An operation, as the picker will eventually list them. */
export type OperationInfo = {
  operationId: string | null;
  method: string;
  path: string;
  summary: string | null;
};

// Specs are large and static; refetching one per request would dominate the
// response time. Keyed by URL, held for the life of the Node process.
const globalForSpecs = globalThis as unknown as {
  openapiSpecs?: Map<string, Promise<Record<string, unknown>>>;
};
if (!globalForSpecs.openapiSpecs) globalForSpecs.openapiSpecs = new Map();
const specs = globalForSpecs.openapiSpecs;

export async function fetchSpec(url: string): Promise<Record<string, unknown>> {
  const cached = specs.get(url);
  if (cached) return cached;
  const pending = (async () => {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Could not fetch the OpenAPI document (${res.status})`);
    return (await res.json()) as Record<string, unknown>;
  })();
  specs.set(url, pending);
  pending.catch(() => specs.delete(url));
  return pending;
}

/** Every operation in a document, for display and for the future picker. */
export function listOperations(spec: Record<string, unknown>): OperationInfo[] {
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>;
  const methods = ["get", "put", "post", "delete", "patch", "head", "options", "trace"];
  return Object.entries(paths).flatMap(([path, item]) =>
    methods
      .filter((method) => item[method])
      .map((method) => {
        const operation = item[method] as { operationId?: string; summary?: string };
        return {
          operationId: operation.operationId ?? null,
          method: method.toUpperCase(),
          path,
          summary: operation.summary ?? null,
        };
      }),
  );
}

/**
 * `apiRoot` for the generated calls. The spec's own `servers[0].url` is the
 * right answer when it is absolute; a relative one (`/v1`) is resolved against
 * the document's own URL, which is the best guess available.
 */
function resolveApiRoot(spec: Record<string, unknown>, specUrl: string): string {
  const servers = spec.servers as { url?: string }[] | undefined;
  const first = servers?.[0]?.url;
  if (!first) return new URL(specUrl).origin;
  try {
    return new URL(first).toString().replace(/\/$/, "");
  } catch {
    return new URL(first, specUrl).toString().replace(/\/$/, "");
  }
}

/**
 * A method name for one operation. `operationId` is optional in OpenAPI, so
 * method + path is the fallback, and either way the result has to be a valid
 * JavaScript identifier: a uicast expression calls a host function by bare
 * name, and `list-pets` would be parsed as subtraction.
 */
function methodNameFor(operationId: string | undefined, method: string, path: string): string {
  const base =
    operationId ??
    `${method.toLowerCase()}${path.replace(/\{([^}]+)\}/g, "By_$1").replace(/[^A-Za-z0-9]+/g, "_")}`;
  const cleaned = base.replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1");
  return cleaned || "operation";
}

/**
 * Give the response schemas their `$defs` back, and drop codegen breadcrumbs.
 *
 * `openAPIToVovkSchema` builds the response and iteration slots with
 * `emitDefs: false` — deliberately, since embedding the ref closure in every
 * handler duplicates the whole components section per operation and overflows
 * large specs. The CLI repairs this when it renders a client; the `deriveTools`
 * path does not, so a tool's `outputSchema` arrives as a bare pointer:
 *
 *   { "$ref": "#/components/schemas/Metrics", "x-tsType": "Mixins.Apisguru.Metrics" }
 *
 * Nothing travels with it, so the pointer resolves to nothing and the prompt
 * says `=> unknown` — the model gets no field names, and can only dump the raw
 * JSON instead of building UI from it. Reattaching costs schema size on the
 * response slots only, which is the trade worth making here.
 *
 * `x-tsType` is a TypeScript namespace the CLI would emit (`Mixins.Apisguru.Metrics`)
 * and `x-contentType` a media-type hint; both are noise in a runtime tool
 * definition, and both would reach the model verbatim.
 */
function repairResponseSchemas(schema: unknown, segmentName: string) {
  const segment = (schema as { segments?: Record<string, Segment> }).segments?.[segmentName];
  if (!segment) return;
  for (const controller of Object.values(segment.controllers ?? {})) {
    for (const handler of Object.values(controller.handlers ?? {})) {
      const validation = handler.validation;
      if (!validation) continue;
      for (const slot of ["output", "iteration"] as const) {
        if (!validation[slot]) continue;
        const repaired = reattachMixinDefs(validation[slot], segment);
        validation[slot] = stripCodegenKeys(repaired) as JSONSchema;
      }
    }
  }
}

/** Recursively drop `x-tsType` / `x-contentType` wherever they appear. */
function stripCodegenKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripCodegenKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "x-tsType" && key !== "x-contentType")
      .map(([key, child]) => [key, stripCodegenKeys(child)]),
  );
}

/** Build the host functions for one connection. Throws if the spec is unusable. */
export async function deriveConnectionTools(connection: Connection): Promise<DerivedConnection> {
  const spec = await fetchSpec(connection.openapiUrl);

  const schema = openAPIToVovkSchema({
    source: { object: spec },
    apiRoot: resolveApiRoot(spec, connection.openapiUrl),
    segmentName: connection.name,
    getModuleName: () => connection.name,
    getMethodName: ({ operationObject, method, path }) =>
      methodNameFor(operationObject.operationId, method, path),
    // Drops component schemas no kept operation references — without it a large
    // spec carries its entire components section into every handler.
    pruneComponents: true,
  } as Parameters<typeof openAPIToVovkSchema>[0]);

  repairResponseSchemas(schema, connection.name);

  // createRPC takes the WHOLE schema and looks the segment up itself.
  const module = createRPC(schema, connection.name, connection.name) as Record<string, unknown>;
  const bound = applyCredential(module, connection);

  return {
    connection,
    tools: deriveTools({ modules: { [connection.name]: bound } }) as StandardToolV0[],
  };
}

/**
 * Bind the connection's credential to every call the module makes, once, rather
 * than passing it per call — a derived tool's `execute` only accepts
 * `{ body, query, params }`, so there is no channel for it in the call itself.
 *
 * Query-parameter credentials are not supported yet: the request URL is built
 * inside the fetcher by `getURL`, which `prepareRequestInit` cannot reach, so
 * it needs plumbing this slice does not have. Failing here is better than
 * deriving tools that quietly call the API unauthenticated.
 */
function applyCredential(module: Record<string, unknown>, connection: Connection) {
  const { authType, authName, authPrefix, credential } = connection;
  if (authType === "none") return module;
  if (!credential || !authName) {
    throw new Error(`Connection "${connection.name}" is missing its credential.`);
  }
  if (authType !== "header") {
    throw new Error(`Connection "${connection.name}": ${authType} auth is not supported yet.`);
  }

  const withDefaults = (
    module as { withDefaults?: (options: unknown) => Record<string, unknown> }
  ).withDefaults;
  if (typeof withDefaults !== "function") return module;

  return withDefaults({
    init: { headers: { [authName]: `${authPrefix ?? ""}${credential}` } },
  });
}

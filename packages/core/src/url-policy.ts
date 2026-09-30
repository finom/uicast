import { isSchemaObject, type JSONSchema, resolvePointer } from "./json-schema";

// An `<img src>` fetches on render, so the destination is checked, not the string that built it.

/**
 * Which URLs a prop declared as a URL (`z.url()`) may hold. An object changes the default rules field by field; a
 * predicate replaces them.
 *
 * @example
 * const urlPolicy: UrlPolicy = { hosts: ["cdn.example.com", "*.imgix.net"] };
 *
 * @example
 * const urlPolicy: UrlPolicy = (url) => url.startsWith("https://cdn.example.com/");
 */
export type UrlPolicy =
  | {
      /** Relative URLs: `/a`, `a/b`, `?q=1`, `#x`. Default `true`. */
      allowRelative?: boolean;
      /** Absolute URLs on the page origin. Default `true`. */
      allowSameOrigin?: boolean;
      /** Extra http/https hosts: an exact match, or `*.example.com` for subdomains (not the apex, so list both). */
      hosts?: readonly string[];
      /** `data:` raster images. Default `true`. SVG is never allowed: it can carry script. */
      allowDataImages?: boolean;
      /** The page origin, for where there is no `location` (SSR); without either, only `hosts` matches an absolute URL. */
      origin?: string;
    }
  | ((url: string) => boolean);

type UrlCheck = { ok: true } | { ok: false; reason: string };

// The defaults, in one place: the check applies them and the prompt describes them.
export const resolveUrlPolicy = (policy: Exclude<UrlPolicy, (url: string) => boolean> = {}) => {
  const { allowRelative = true, allowSameOrigin = true, hosts = [], allowDataImages = true, origin } = policy;
  return { allowRelative, allowSameOrigin, hosts, allowDataImages, origin };
};

const OK: UrlCheck = { ok: true };

// Never fetch on their own.
const INERT_SCHEMES = new Set(["mailto", "tel", "sms", "blob"]);

// No `svg+xml`: SVG can carry script.
const DATA_IMAGE_RE = /^data:image\/(png|jpe?g|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon)[;,]/i;

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;

// For http(s) the URL parser reads `\` as `/`, so a value with no scheme names a host exactly when it starts with two.
const NAMES_HOST_RE = /^[\\/]{2}/;

// Supplies only the scheme: a value that names a host keeps its own.
const NETWORK_PATH_BASE = "https://base.invalid/";

// Strip what the URL parser strips, or `"java\nscript:"` reads as relative here and `javascript:` in the DOM.
const normalize = (raw: string): string => {
  const url = raw.replace(/[\t\n\r]/g, "");
  // A loop, not a regex: a trailing `[\0- ]+$` takes quadratic time on a long run of spaces.
  let start = 0;
  let end = url.length;
  while (start < end && url.charCodeAt(start) <= 0x20) start++;
  while (end > start && url.charCodeAt(end - 1) <= 0x20) end--;
  return url.slice(start, end);
};

const parseUrl = (url: string, base?: string): URL | null => {
  try {
    return new URL(url, base);
  } catch {
    return null;
  }
};

const hostAllowed = (host: string, hosts: readonly string[]): boolean => {
  const lower = host.toLowerCase();
  return hosts.some((entry) => {
    const pattern = entry.toLowerCase();
    if (pattern.startsWith("*.")) {
      return lower.endsWith(pattern.slice(1)) && lower !== pattern.slice(2);
    }
    return lower === pattern;
  });
};

// Parsed once per string: an explicit origin with a path or a trailing slash still names its origin.
const explicitOrigins = new Map<string, string | null>();

const currentOrigin = (explicit?: string): string | null => {
  if (!explicit) return typeof location !== "undefined" ? location.origin : null;
  let origin = explicitOrigins.get(explicit);
  if (origin === undefined) {
    origin = parseUrl(explicit)?.origin ?? null;
    explicitOrigins.set(explicit, origin);
  }
  return origin;
};

const checkHost = (
  url: URL,
  allowSameOrigin: boolean,
  explicitOrigin: string | undefined,
  hosts: readonly string[],
): UrlCheck => {
  if (allowSameOrigin && url.origin === currentOrigin(explicitOrigin)) return OK;
  if (hosts.length && hostAllowed(url.hostname, hosts)) return OK;
  return {
    ok: false,
    reason:
      `"${url.hostname}" is not an allowed host. Add it to the renderer's ` +
      `urlPolicy ({ hosts: ["${url.hostname}"] }) if this destination is trusted`,
  };
};

// An empty string passes: nothing to fetch.
export const checkUrl = (value: string, policy?: UrlPolicy): UrlCheck => {
  const url = normalize(value);
  if (!url) return OK;

  if (typeof policy === "function") {
    return policy(url) ? OK : { ok: false, reason: "rejected by the host's urlPolicy predicate" };
  }

  const { allowRelative, allowSameOrigin, hosts, allowDataImages, origin: explicitOrigin } = resolveUrlPolicy(policy);
  const scheme = SCHEME_RE.exec(url)?.[1]?.toLowerCase() ?? null;

  if (scheme === null) {
    if (NAMES_HOST_RE.test(url)) {
      const resolved = parseUrl(url, NETWORK_PATH_BASE);
      if (!resolved) return { ok: false, reason: "not a parseable URL" };
      return checkHost(resolved, allowSameOrigin, explicitOrigin, hosts);
    }
    return allowRelative ? OK : { ok: false, reason: "relative URLs are not allowed by this urlPolicy" };
  }

  if (scheme === "data") {
    if (allowDataImages && DATA_IMAGE_RE.test(url)) return OK;
    return {
      ok: false,
      reason: DATA_IMAGE_RE.test(url)
        ? "data: URLs are not allowed by this urlPolicy"
        : 'only "data:image/<raster>" URLs are allowed (svg+xml can carry script)',
    };
  }

  if (INERT_SCHEMES.has(scheme)) return OK;

  if (scheme !== "http" && scheme !== "https") {
    return { ok: false, reason: `the "${scheme}:" scheme is not allowed` };
  }

  const parsed = parseUrl(url);
  if (!parsed) return { ok: false, reason: "not a parseable absolute URL" };
  return checkHost(parsed, allowSameOrigin, explicitOrigin, hosts);
};

type UrlViolation = { path: string; url: string; reason: string };

const URL_FORMATS = new Set(["uri", "url", "uri-reference", "iri", "iri-reference"]);

const hasUrlFormat = (node: object): boolean => {
  const format: unknown = Object.hasOwn(node, "format") ? Reflect.get(node, "format") : undefined;
  return typeof format === "string" && URL_FORMATS.has(format);
};

// What a walk learns about a schema's nodes, kept per document: a `$ref` resolves against the document it sits in.
type SchemaIndex = { root: JSONSchema; reach: Map<object, boolean>; applicable: Map<JSONSchema, JSONSchema[]> };
const indexes = new WeakMap<JSONSchema, SchemaIndex>();

const indexOf = (root: JSONSchema): SchemaIndex => {
  let index = indexes.get(root);
  if (!index) {
    index = { root, reach: new Map(), applicable: new Map() };
    indexes.set(root, index);
  }
  return index;
};

// Whether a URL format sits at or below `start`, through any keyword and any `$ref` chain. A stack, so depth sets no limit.
const reachesUrlFormat = (index: SchemaIndex, start: unknown): boolean => {
  if (typeof start !== "object" || start === null) return false;
  const cached = index.reach.get(start);
  if (cached !== undefined) return cached;

  const seen = new Set<object>();
  const stack: unknown[] = [start];
  let found = false;
  while (!found && stack.length > 0) {
    const node = stack.pop();
    if (typeof node !== "object" || node === null || seen.has(node)) continue;
    seen.add(node);
    found = hasUrlFormat(node);
    for (const [key, child] of Object.entries(node)) {
      stack.push(key === "$ref" && typeof child === "string" ? resolvePointer(child, index.root) : child);
    }
  }
  index.reach.set(start, found);
  return found;
};

// The nodes that hold for one value: `start` and every applicator under it that keeps the value.
// All but `not` (a URL format under it forbids a URL); one that holds for only some values counts for all.
const applicableNodes = (index: SchemaIndex, start: JSONSchema): JSONSchema[] => {
  const cached = index.applicable.get(start);
  if (cached) return cached;

  const out = new Set<JSONSchema>();
  const stack: unknown[] = [start];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!isSchemaObject(node) || out.has(node) || !reachesUrlFormat(index, node)) continue;
    out.add(node);
    if (typeof node.$ref === "string") stack.push(resolvePointer(node.$ref, index.root));
    stack.push(...(node.allOf ?? []), ...(node.anyOf ?? []), ...(node.oneOf ?? []));
    stack.push(node.if, node.then, node.else, ...Object.values(node.dependentSchemas ?? {}));
  }
  const nodes = [...out];
  index.applicable.set(start, nodes);
  return nodes;
};

// The path is built only for a violation: most values pass.
type Visit = { node: JSONSchema; value: unknown; parent: Visit | null; key: string | number };

const pathOf = (visit: Visit): string => {
  let path = "";
  for (let at: Visit | null = visit; at?.parent; at = at.parent) {
    const step = typeof at.key === "number" ? `[${at.key}]` : `.${at.key}`;
    path = step + path;
  }
  return path.startsWith(".") ? path.slice(1) : path;
};

// A subschema with no URL format below it is never walked, so a URL-free table costs nothing.
const pushVisit = (
  stack: Visit[],
  index: SchemaIndex,
  node: unknown,
  value: unknown,
  parent: Visit,
  key: string | number,
): void => {
  if (isSchemaObject(node) && reachesUrlFormat(index, node)) stack.push({ node, value, parent, key });
};

// Only declared URL props are checked: a URL-looking `text` prop is content.
export const findUrlViolations = (
  schema: JSONSchema | undefined,
  value: unknown,
  policy?: UrlPolicy,
): UrlViolation[] => {
  if (!schema) return [];
  const index = indexOf(schema);
  if (!reachesUrlFormat(index, schema)) return [];
  const out: UrlViolation[] = [];
  const flagged = new Set<string>();
  // Per object, the nodes already applied: a shared or cyclic value is walked once per node.
  const walked = new WeakMap<object, Set<JSONSchema>>();

  // Children are pushed last to first, so values are checked, and violations reported, in document order.
  const stack: Visit[] = [{ node: schema, value, parent: null, key: "" }];
  for (let visit = stack.pop(); visit; visit = stack.pop()) {
    const val = visit.value;
    const nodes = applicableNodes(index, visit.node);
    if (typeof val === "string") {
      if (!nodes.some(hasUrlFormat)) continue;
      const result = checkUrl(val, policy);
      if (result.ok) continue;
      const path = pathOf(visit);
      if (!flagged.has(path)) {
        flagged.add(path);
        out.push({ path, url: val, reason: result.reason });
      }
      continue;
    }
    if (typeof val !== "object" || val === null) continue;
    let done = walked.get(val);
    if (!done) {
      done = new Set();
      walked.set(val, done);
    }
    for (let n = nodes.length - 1; n >= 0; n--) {
      const node = nodes[n];
      if (done.has(node)) continue;
      done.add(node);
      if (Array.isArray(val)) {
        const tuple = node.prefixItems ?? [];
        for (let i = val.length - 1; i >= 0; i--) {
          pushVisit(stack, index, node.unevaluatedItems, val[i], visit, i);
          pushVisit(stack, index, node.contains, val[i], visit, i);
          pushVisit(stack, index, i < tuple.length ? tuple[i] : node.items, val[i], visit, i);
        }
        continue;
      }
      const declared = node.properties ?? {};
      // Patterns are not matched: each one applies to every key.
      const patterns = Object.values(node.patternProperties ?? {});
      const entries = Object.entries(val);
      for (let e = entries.length - 1; e >= 0; e--) {
        const [key, child] = entries[e];
        if (Object.hasOwn(declared, key)) {
          pushVisit(stack, index, declared[key], child, visit, key);
        } else {
          pushVisit(stack, index, node.unevaluatedProperties, child, visit, key);
          pushVisit(stack, index, node.additionalProperties, child, visit, key);
        }
        for (const sub of patterns) pushVisit(stack, index, sub, child, visit, key);
        pushVisit(stack, index, node.propertyNames, key, visit, key);
      }
    }
  }
  return out;
};

export const schemaHasUrlFormat = (schema: JSONSchema | undefined): boolean =>
  schema !== undefined && reachesUrlFormat(indexOf(schema), schema);

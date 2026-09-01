import type { JSONSchema } from "../prompt-utils/json-schema-to-ts";

// Which URLs a document may put into a def-declared URL prop (`z.url()`).
// Building any string is legal in the evaluator — the danger is the
// DESTINATION: `<img src>` fetches on render with no interaction. Checked
// where the destination is declared, strict by default.

/**
 * Fine-grained policy, or a predicate for hosts that want their own rule.
 * Every field is optional; the defaults are the strict ones.
 */
export type UrlPolicy =
	| {
			/** Relative URLs — `/a`, `a/b`, `?q=1`, `#x`. Default `true`. */
			allowRelative?: boolean;
			/** Absolute URLs matching the page origin. Default `true`. */
			allowSameOrigin?: boolean;
			/** Extra http/https hosts. Exact match, or `*.example.com` for subdomains (not the apex — list both). */
			hosts?: readonly string[];
			/** `data:` raster images. Default `true`. SVG stays excluded regardless — it can carry script. */
			allowDataImages?: boolean;
			/**
			 * Page origin, for environments with no `location` (SSR). Without it,
			 * `allowSameOrigin` cannot match and only `hosts` applies.
			 */
			origin?: string;
	  }
	| ((url: string) => boolean);

export type UrlCheck = { ok: true } | { ok: false; reason: string };

/** Schemes that never fetch on their own and need no origin check. */
const INERT_SCHEMES = new Set(["mailto", "tel", "sms", "blob"]);

/** Raster image media types accepted in a `data:` URL. No `svg+xml`. */
const DATA_IMAGE_RE =
	/^data:image\/(png|jpe?g|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon)[;,]/i;

const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;

/** Strip what the URL parser strips (tab/LF/CR, edge C0 controls) — otherwise `"java\nscript:"` reads as relative here and `javascript:` in the DOM. */
const normalize = (raw: string): string =>
	raw
		.replace(/[\t\n\r]/g, "")
		// biome-ignore lint/suspicious/noControlCharactersInRegex: mirroring the URL parser is the point
		.replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, "");

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

const currentOrigin = (explicit?: string): string | null => {
	if (explicit) return explicit;
	if (typeof location !== "undefined" && location?.origin) return location.origin;
	return null;
};

/**
 * Is this URL string allowed to reach a component? Non-strings and empty
 * strings pass — there is nothing to fetch, and the schema owns the type.
 */
export const checkUrl = (value: unknown, policy?: UrlPolicy): UrlCheck => {
	if (typeof value !== "string") return { ok: true };
	const url = normalize(value);
	if (!url) return { ok: true };

	if (typeof policy === "function") {
		return policy(url)
			? { ok: true }
			: { ok: false, reason: "rejected by the host's urlPolicy predicate" };
	}

	const {
		allowRelative = true,
		allowSameOrigin = true,
		hosts = [],
		allowDataImages = true,
		origin: explicitOrigin,
	} = policy ?? {};

	// Protocol-relative (`//host/path`) is absolute, not relative.
	const isProtocolRelative = url.startsWith("//");
	const scheme = isProtocolRelative
		? "https"
		: (SCHEME_RE.exec(url)?.[1]?.toLowerCase() ?? null);

	if (scheme === null) {
		return allowRelative
			? { ok: true }
			: { ok: false, reason: "relative URLs are not allowed by this urlPolicy" };
	}

	if (scheme === "data") {
		if (allowDataImages && DATA_IMAGE_RE.test(url)) return { ok: true };
		return {
			ok: false,
			reason: DATA_IMAGE_RE.test(url)
				? "data: URLs are not allowed by this urlPolicy"
				: 'only "data:image/<raster>" URLs are allowed (svg+xml can carry script)',
		};
	}

	if (INERT_SCHEMES.has(scheme)) return { ok: true };

	if (scheme !== "http" && scheme !== "https") {
		return { ok: false, reason: `the "${scheme}:" scheme is not allowed` };
	}

	const origin = currentOrigin(explicitOrigin);
	let parsed: URL;
	try {
		parsed = new URL(isProtocolRelative ? `https:${url}` : url);
	} catch {
		return { ok: false, reason: "not a parseable absolute URL" };
	}

	if (allowSameOrigin && origin && parsed.origin === origin) return { ok: true };
	if (hosts.length && hostAllowed(parsed.hostname, hosts)) return { ok: true };

	return {
		ok: false,
		reason:
			`"${parsed.hostname}" is not an allowed host. Add it to the renderer's ` +
			`urlPolicy ({ hosts: ["${parsed.hostname}"] }) if this destination is trusted`,
	};
};

/** One rejected URL, with the prop path that carried it. */
export type UrlViolation = { path: string; url: string; reason: string };

/** Every JSON Schema `format` this treats as a URL. */
const URL_FORMATS = new Set(["uri", "url", "uri-reference", "iri", "iri-reference"]);

const MAX_DEPTH = 12;

const deref = (schema: JSONSchema, root: JSONSchema): JSONSchema => {
	const ref = schema.$ref;
	if (!ref?.startsWith("#/")) return schema;
	let node: unknown = root;
	for (const raw of ref.slice(2).split("/")) {
		const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
		if (!node || typeof node !== "object") return schema;
		node = (node as Record<string, unknown>)[key];
	}
	return node && typeof node === "object" ? (node as JSONSchema) : schema;
};

/**
 * Walk the props schema next to the value, collecting URL-declared strings the
 * policy rejects. Only DECLARED props are checked: a URL-looking `text` prop
 * is content, not a destination.
 */
export const findUrlViolations = (
	schema: JSONSchema | undefined,
	value: unknown,
	policy?: UrlPolicy,
): UrlViolation[] => {
	if (!schema) return [];
	const out: UrlViolation[] = [];
	const root = schema;

	const walk = (node: JSONSchema, val: unknown, path: string, depth: number): void => {
		if (depth > MAX_DEPTH || val === null || val === undefined) return;
		const s = deref(node, root);

		for (const branch of [...(s.anyOf ?? []), ...(s.oneOf ?? []), ...(s.allOf ?? [])]) {
			walk(branch, val, path, depth + 1);
		}

		if (typeof val === "string" && s.format && URL_FORMATS.has(s.format)) {
			const result = checkUrl(val, policy);
			if (!result.ok && !out.some((v) => v.path === path)) {
				out.push({ path, url: val, reason: result.reason });
			}
			return;
		}

		if (Array.isArray(val)) {
			const items = typeof s.items === "object" ? s.items : undefined;
			if (!items) return;
			val.forEach((item, i) => {
				walk(items, item, `${path}[${i}]`, depth + 1);
			});
			return;
		}

		if (typeof val === "object" && s.properties) {
			for (const [key, child] of Object.entries(s.properties)) {
				if (!Object.hasOwn(val as object, key)) continue;
				walk(
					child,
					(val as Record<string, unknown>)[key],
					path ? `${path}.${key}` : key,
					depth + 1,
				);
			}
		}
	};

	walk(root, value, "", 0);
	return out;
};

/** Does the schema declare any URL-formatted string? One-time scan so URL-free components skip the walk. */
export const schemaHasUrlFormat = (schema: JSONSchema | undefined): boolean => {
	if (!schema) return false;
	const seen = new Set<object>();
	const scan = (node: unknown, depth: number): boolean => {
		if (depth > MAX_DEPTH || !node || typeof node !== "object") return false;
		if (seen.has(node)) return false;
		seen.add(node);
		const s = node as JSONSchema;
		if (s.format && URL_FORMATS.has(s.format)) return true;
		for (const child of Object.values(node as Record<string, unknown>)) {
			if (Array.isArray(child)) {
				if (child.some((c) => scan(c, depth + 1))) return true;
			} else if (scan(child, depth + 1)) return true;
		}
		return false;
	};
	return scan(schema, 0);
};

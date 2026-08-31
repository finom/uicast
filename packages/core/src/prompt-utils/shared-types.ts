import { dashTail, stripRootDescription } from "./describe";
import {
	type JSONSchema,
	JSONSchemaToTs,
	resolveRef,
} from "./json-schema-to-ts";

/**
 * A definition hoisted out of some schema's `$defs` / `definitions` and given
 * a name the prompt prints once.
 */
type Entry = {
	name: string;
	node: unknown;
	/** Its document's pointer→name map, so a self-reference renders as the name. */
	refs: Record<string, string>;
};

export type SharedTypes = {
	/**
	 * Register one schema document's definitions. Returns the pointer→name map
	 * for THAT document — pass it to `JSONSchemaToTs` as `namedRefs` when
	 * rendering anything from it. Pointers are document-local (`#/$defs/Person`
	 * means different things in two documents), which is why the map is
	 * per-document rather than global.
	 */
	add(jsonSchema: unknown): Record<string, string>;
	/** One `- Name: <type>` line per hoisted definition, in registration order. */
	lines(): string[];
};

const DEFS_KEYS = ["$defs", "definitions"] as const;

/** JSON Pointer escaping — `~` and `/` inside a definition name. */
const escapePointer = (key: string) =>
	key.replace(/~/g, "~0").replace(/\//g, "~1");

/**
 * A definition name has to survive being printed as a bare type in a TypeScript
 * signature, so anything that isn't identifier-shaped is stripped. An empty
 * result falls back to a positional name.
 */
const toTypeName = (key: string, ordinal: number): string => {
	const cleaned = key.replace(/[^A-Za-z0-9_]/g, "");
	return /^[A-Za-z_]/.test(cleaned) ? cleaned : `Type${ordinal}`;
};

/** Every `$ref` pointer that appears anywhere inside `node`. */
const collectRefs = (node: unknown, out: Set<string>): void => {
	if (node === null || typeof node !== "object") return;
	if (Array.isArray(node)) {
		for (const item of node) collectRefs(item, out);
		return;
	}
	for (const [key, value] of Object.entries(node)) {
		if (key === "$ref" && typeof value === "string") out.add(value);
		else collectRefs(value, out);
	}
};

/**
 * A definition's identity for dedup. Textual equality is not enough: two
 * documents can hold byte-identical defs whose internal `$ref`s point at
 * DIFFERENT targets — deduping those would print a wrong type. So each
 * referenced pointer's resolved content is folded in, cycles marked.
 */
const fingerprintNode = (
	node: unknown,
	doc: unknown,
	expanding = new Set<string>(),
): string => {
	const base = JSON.stringify(node);
	const refs = new Set<string>();
	collectRefs(node, refs);
	if (refs.size === 0) return base;
	const parts = [...refs].sort().map((pointer) => {
		if (expanding.has(pointer)) return `${pointer}=~cycle`;
		expanding.add(pointer);
		const part = `${pointer}=${fingerprintNode(resolveRef(pointer, doc), doc, expanding)}`;
		expanding.delete(pointer);
		return part;
	});
	return `${base}|${parts.join("|")}`;
};

/** Does `node` reference `pointer`, directly or through other definitions? */
const isSelfReferential = (
	pointer: string,
	node: unknown,
	doc: unknown,
): boolean => {
	const seen = new Set<string>();
	const stack = [node];
	while (stack.length > 0) {
		const refs = new Set<string>();
		collectRefs(stack.pop(), refs);
		for (const ref of refs) {
			if (ref === pointer) return true;
			if (!seen.has(ref)) {
				seen.add(ref);
				stack.push(resolveRef(ref, doc));
			}
		}
	}
	return false;
};

/**
 * Collects the `$defs` / `definitions` of every schema handed to it, so the
 * prompt prints each named type once and references it by name — which also
 * makes recursion expressible (inlined, a self-referential schema silently
 * degrades to `unknown[]` at the cycle guard; named, it is exactly
 * `type Node = { children?: Node[] }`). Every definition is hoisted, not just
 * multiply-referenced ones — `$defs` means "a named concept", and hoisting by
 * usage count would make the output depend on counts the reader can't see.
 */
export function collectSharedTypes(): SharedTypes {
	const entries: Entry[] = [];
	// name → fingerprint, so the same definition registered twice reuses its
	// name and a DIFFERENT definition under the same name gets a fresh one.
	const takenNames = new Map<string, string>();

	const add = (jsonSchema: unknown): Record<string, string> => {
		const refs: Record<string, string> = {};
		if (jsonSchema === null || typeof jsonSchema !== "object") return refs;
		const doc = jsonSchema as JSONSchema;

		// A document that is nothing but a `$ref` into its own definitions has no
		// shape of its own; naming that target would render the whole schema as a
		// bare word and move the payload out of the site that needs it. Exception:
		// a RECURSIVE target (the shape a top-level `z.lazy` emits) must still be
		// hoisted, or its recursion degrades to `unknown[]`.
		const rootRef = typeof doc.$ref === "string" ? doc.$ref : null;

		for (const defsKey of DEFS_KEYS) {
			const defs = doc[defsKey];
			if (!defs || typeof defs !== "object") continue;
			for (const [key, node] of Object.entries(defs)) {
				const pointer = `#/${defsKey}/${escapePointer(key)}`;
				if (pointer === rootRef && !isSelfReferential(pointer, node, doc)) {
					continue;
				}
				const fingerprint = fingerprintNode(node, doc);

				// Walk past names already spoken for by a DIFFERENT type; landing on
				// one that already holds this same type means it is printed already.
				const base = toTypeName(key, entries.length + 1);
				let name = base;
				for (
					let n = 2;
					takenNames.has(name) && takenNames.get(name) !== fingerprint;
					n++
				) {
					name = `${base}${n}`;
				}
				refs[pointer] = name;
				if (takenNames.has(name)) continue;
				takenNames.set(name, fingerprint);
				entries.push({ name, node, refs });
			}
		}
		return refs;
	};

	const lines = (): string[] =>
		entries.map((entry) => {
			// Rendered from the NODE, not through its `$ref` — so the definition's
			// own self-references resolve to its name instead of expanding.
			const description = (entry.node as JSONSchema | null)?.description;
			const body = JSONSchemaToTs(stripRootDescription(entry.node), {
				namedRefs: entry.refs,
			});
			return `- ${entry.name}: ${body}${dashTail(description)}`;
		});

	return { add, lines };
}

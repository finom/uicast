import { type JSONSchema, JSONSchemaToTs } from "./json-schema-to-ts";

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

/**
 * Collects the `$defs` / `definitions` of every schema handed to it, so a
 * prompt can print each named type ONCE and reference it by name everywhere
 * else — the same trick `commonEvents` plays for shared event payloads.
 *
 * Two things this buys, both of which the inlining renderer gets wrong:
 *
 * - **Recursion becomes expressible.** Inlining a self-referential schema
 *   bottoms out at the cycle guard, so a tree renders one level deep and then
 *   `unknown[]` — silently, as if that were the shape. Named, it is exactly
 *   `type Node = { children?: Node[] }`.
 * - **A type shared by ten tools is printed once**, not ten times.
 *
 * Every definition is hoisted, not just the multiply-referenced ones: a schema
 * author puts something in `$defs` because it is a named concept, and picking
 * which ones "deserve" a name would make the output depend on usage counts the
 * reader can't see.
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
		// bare word and move the payload out of the site that needs it.
		const rootRef = typeof doc.$ref === "string" ? doc.$ref : null;

		for (const defsKey of DEFS_KEYS) {
			const defs = doc[defsKey];
			if (!defs || typeof defs !== "object") continue;
			for (const [key, node] of Object.entries(defs)) {
				const pointer = `#/${defsKey}/${escapePointer(key)}`;
				if (pointer === rootRef) continue;
				const fingerprint = JSON.stringify(node);

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
			const body = JSONSchemaToTs(
				description
					? { ...(entry.node as JSONSchema), description: undefined }
					: entry.node,
				{ namedRefs: entry.refs },
			);
			return `- ${entry.name}: ${body}${description ? ` — ${description}` : ""}`;
		});

	return { add, lines };
}

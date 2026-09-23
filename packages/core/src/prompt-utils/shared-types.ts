import { dashTail, stripRootAnnotations } from "./describe";
import {
	type JSONSchema,
	jsonSchemaToTs,
	resolveRef,
} from "./json-schema-to-ts";

type Entry = {
	name: string;
	node: unknown;
	// Pointer→name map of its document, so a self-reference renders as the name.
	refs: Record<string, string>;
};

export type SharedTypes = {
	// Pointers are document-local, hence a map per document.
	add(jsonSchema: unknown): Record<string, string>;
	lines(): string[];
};

const DEFS_KEYS = ["$defs", "definitions"] as const;

const escapePointer = (key: string) =>
	key.replace(/~/g, "~0").replace(/\//g, "~1");

const toTypeName = (key: string, ordinal: number): string => {
	const cleaned = key.replace(/[^A-Za-z0-9_]/g, "");
	return /^[A-Za-z_]/.test(cleaned) ? cleaned : `Type${ordinal}`;
};

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

// Byte-equal defs can `$ref` different targets, so the referenced content is folded in.
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

// Every definition is hoisted, not just shared ones, so recursion stays expressible.
export function collectSharedTypes(): SharedTypes {
	const entries: Entry[] = [];
	// name → fingerprint: a different definition under a taken name gets a fresh one.
	const takenNames = new Map<string, string>();

	const add = (jsonSchema: unknown): Record<string, string> => {
		const refs: Record<string, string> = {};
		if (jsonSchema === null || typeof jsonSchema !== "object") return refs;
		const doc = jsonSchema as JSONSchema;

		// A recursive root `$ref` (top-level `z.lazy`) must be hoisted or it degrades to `unknown[]`.
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

				// A name already holding this same type means it is printed already.
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
			// From the node, not through its `$ref`, so self-references resolve to the name.
			const description = (entry.node as JSONSchema | null)?.description;
			const body = jsonSchemaToTs(stripRootAnnotations(entry.node), {
				namedRefs: entry.refs,
			});
			return `- ${entry.name}: ${body}${dashTail(description)}`;
		});

	return { add, lines };
}

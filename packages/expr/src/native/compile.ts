import type * as acorn from "acorn";
import { ExpressionError } from "../errors";
import { ALLOWED_GLOBALS } from "../globals";

// Validate against the shared grammar, then run with `new Function`. The
// residual — run-time-assembled names, uncapped allocation and time — is
// pinned by the parity suite.

/** Bound to `undefined` as a backstop. The free-identifier allow-list already refuses these; this set comes from a separate identifier walk, so it survives a bug in that analysis. */
const GLOBALS_TO_SHADOW: readonly string[] = [
	"globalThis", "self", "window", "global", "document", "navigator", "location",
	"history", "localStorage", "sessionStorage", "indexedDB",
	"fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker",
	"ServiceWorker", "importScripts", "Image", "Audio",
	"Function", "WebAssembly", "setTimeout", "setInterval", "setImmediate",
	"requestAnimationFrame", "requestIdleCallback", "queueMicrotask",
	"process", "require", "module", "exports", "__dirname", "__filename", "Buffer",
	"Deno", "Bun",
	"alert", "confirm", "prompt", "close", "open", "print", "postMessage",
	"top", "parent", "frames", "opener", "crypto", "caches", "cookieStore",
	"structuredClone", "scheduler", "navigation", "customElements",
	"MessageChannel", "BroadcastChannel", "Notification",
	"Proxy", "Reflect", "SharedArrayBuffer", "Atomics",
	"RegExp", "Symbol", "BigInt", "Promise",
];

/** Every identifier name in the tree, bound or free — the shadow backstop's input. */
const identifierNames = (node: acorn.AnyNode, out: Set<string>): void => {
	if (node.type === "Identifier") out.add(node.name);
	for (const key of Object.keys(node)) {
		if (key === "type" || key === "start" || key === "end") continue;
		const child = (node as unknown as Record<string, unknown>)[key];
		const visit = (v: unknown) => {
			if (v && typeof v === "object" && typeof (v as acorn.AnyNode).type === "string") {
				identifierNames(v as acorn.AnyNode, out);
			}
		};
		if (Array.isArray(child)) child.forEach(visit);
		else visit(child);
	}
};

export type CompiledNative = (values: readonly unknown[]) => unknown;

/**
 * Compile validated source to a real function (the caller ran `validateNode`).
 * `bindingNames` are the free identifiers the caller supplies: they become
 * parameters — shadowing same-named globals — taken positionally.
 */
export const compileNative = (
	source: string,
	ast: acorn.Expression,
	freeIds: readonly string[],
	bindingNames: readonly string[],
): CompiledNative => {
	const allowed = new Set<string>([...bindingNames, ...ALLOWED_GLOBALS]);

	// An unknown free identifier is refused here rather than resolving to a
	// platform global at run time.
	for (const id of freeIds) {
		if (!allowed.has(id)) {
			throw new ExpressionError(`"${id}" is not available in expressions`, "unknown-reference");
		}
	}

	const bindings = [...new Set(bindingNames)];
	const taken = new Set(bindings);

	// Allow-listed globals are NOT injected: in this mode they are the real
	// platform objects, so letting them resolve naturally is both correct and
	// what keeps the call cheap — a parameter per global would cost more per
	// evaluation than the expression itself.
	const present = new Set<string>();
	identifierNames(ast, present);
	const shadows = GLOBALS_TO_SHADOW.filter(
		(name) => present.has(name) && !taken.has(name),
	);

	const params = [...bindings, ...shadows];
	const Ctor = Function;

	let fn: (...args: unknown[]) => unknown;
	try {
		fn = new Ctor(...params, `"use strict"; return (${source});`) as (
			...args: unknown[]
		) => unknown;
	} catch (err) {
		// Parsed and validated but would not compile — surfaced as a classified
		// document fault rather than a raw SyntaxError.
		throw new ExpressionError(
			`Failed to compile expression: ${err instanceof Error ? err.message : String(err)}. Expression: ${source}`,
			"expression-syntax",
		);
	}

	// Usually there are no shadows at all, so the call is just the bindings —
	// one to three arguments, not sixty.
	if (shadows.length === 0) {
		switch (bindings.length) {
			case 0:
				return () => fn();
			case 1:
				return (values) => fn(values[0]);
			case 2:
				return (values) => fn(values[0], values[1]);
			case 3:
				return (values) => fn(values[0], values[1], values[2]);
			case 4:
				return (values) => fn(values[0], values[1], values[2], values[3]);
			default:
				return (values) => fn(...values);
		}
	}

	const shadowValues = new Array(shadows.length).fill(undefined);
	return (values) => fn(...values, ...shadowValues);
};

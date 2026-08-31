import type { ReactiveProxy } from "@uicast/core";

/**
 * Where a list row's writes land beyond its own scope: the list's source
 * array (fired for `item.*` writes — the data lives there), and the containing
 * scope's `childScopes.<as>` (`anyWrite: true` — fired for EVERY row write,
 * flags included). `dep` is the full `scopes.<name>.<path>` string wave
 * planning compares against.
 */
export type ForwardTarget = {
	scope: ReactiveProxy;
	path: string;
	dep: string;
	anyWrite?: boolean;
};

// Row proxy → its current forward targets. The list renderer refreshes the
// entry on every render; the listener reads it at fire time, so targets stay
// current without re-subscribing.
const targetsByProxy = new WeakMap<ReactiveProxy, ForwardTarget[]>();

const isItemPath = (path: string): boolean =>
	path === "item" || path.startsWith("item.");

/**
 * Declare where writes into this row scope forward. An `item.*` write mutates
 * an object the source array holds, leaving the array's readers stale — this
 * re-emits on the array's own path (and on `childScopes.<as>`) to wake them.
 * Attaches the listener once per proxy; later calls only swap the targets.
 */
export function setItemForwardTargets(
	proxy: ReactiveProxy,
	targets: ForwardTarget[],
): void {
	const attached = targetsByProxy.has(proxy);
	targetsByProxy.set(proxy, targets);
	if (attached) return;
	proxy.$emitter.on<{ path: string }>("*", ({ path }) => {
		const itemWrite = isItemPath(path);
		for (const t of targetsByProxy.get(proxy) ?? []) {
			if (!itemWrite && !t.anyWrite) continue;
			// A nested row's target is a path on its parent's row scope, so this
			// emit trips the parent's own forwarder — the write cascades outward
			// without anyone holding the whole chain.
			t.scope.$emitter.emit(t.path, {
				path: t.path,
				value: undefined,
				oldValue: undefined,
			});
		}
	});
}

/**
 * The paths a `set` into this row scope also writes — transitive, mirroring
 * the emit cascade above. Wave planning declares these so a later step
 * reading the source array (or `childScopes`) waits for the row write.
 */
export function getItemWriteAliases(
	proxy: ReactiveProxy,
	itemWrite: boolean,
): string[] {
	const out = new Set<string>();
	const visit = (p: ReactiveProxy, item: boolean) => {
		for (const t of targetsByProxy.get(p) ?? []) {
			if (!item && !t.anyWrite) continue;
			if (out.has(t.dep)) continue;
			out.add(t.dep);
			visit(t.scope, isItemPath(t.path));
		}
	};
	visit(proxy, itemWrite);
	return [...out];
}

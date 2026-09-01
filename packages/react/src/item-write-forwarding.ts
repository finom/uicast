import type { ReactiveProxy } from "@uicast/core";

/**
 * Where a row's writes land beyond its own scope: the list's source array
 * (`item.*` writes) and the container's `childScopes.<as>` (every write).
 * `dep` is the full path wave planning compares against.
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

/** Declare a row scope's write-forwarding: `item.*` writes re-emit on the source array's path so its readers wake. Listener attaches once; later calls swap targets. */
export function setItemForwardTargets(
	proxy: ReactiveProxy,
	targets: ForwardTarget[],
): void {
	const attached = targetsByProxy.has(proxy);
	targetsByProxy.set(proxy, targets);
	if (attached) return;
	proxy.$emitter.on("*", ({ path }) => {
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

/** Paths a row-scope `set` also writes (transitive) — declared to wave planning so later reads wait. */
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

"use client";
import React, { memo, Suspense, use, useEffect, useReducer, useRef } from "react";
import { createProxyScope, isComponentListEntry, evaluate, extractDeps, parseScope } from "@ui-fired/core";
import { useRendererRegistry } from "../store/renderer-registry";
import { DefaultErrorComponent, ErrorBoundary } from "../visuals/error-boundary";
import { useElement } from "../store/elements-store";
import type { InitFn, UnknownComponentProps } from "../types";

type Scopes = Record<string, ReturnType<typeof createProxyScope>>;
type PlaceholderComponent = () => React.ReactElement | null;

// Stable no-op placeholder. Hoisted so the `fallback` prop passed to child
// slots keeps a constant identity (a fresh `() => null` each render would
// defeat the `React.memo` bail below).
const NullPlaceholder: PlaceholderComponent = () => null;

// Zero-dependency default for the `systemVisuals.unknown` slot — like the error
// default, a bare inline-styled div (the shadcn-styled version ships in
// @ui-fired/catalog as `UnknownComponent`).
const DefaultUnknown = ({
  componentName,
  elementKey,
}: UnknownComponentProps) => (
  <div style={{ color: "yellow" }} data-key={elementKey}>
    Unknown component: {componentName}
  </div>
);

type RecursiveRendererProps = {
  elementKey: string;
  scopes: Scopes;
  // One-shot side-effect callback. Set ONLY for the top-level mount of the
  // synthetic RootFragment wrapper that `<Renderer>` builds;
  // recursive child mounts below intentionally omit this prop so descendants
  // never re-fire `init`. Sync writes via the reactive Proxy (e.g.
  // `scopes.root.x = 1`) land immediately; async returns join the existing
  // `setDefaultsPromiseRef` Suspense pipeline.
  init?: InitFn;
  // Placeholder shown while THIS node's entry hasn't streamed in yet. Supplied
  // by the parent (its per-component placeholder, else the registry default)
  // so an unstreamed child slot looks the same as it did when the parent owned
  // the decision. A stable reference, so it doesn't break memoization.
  fallback?: PlaceholderComponent;
  // True only when `ListRenderer` renders this element once per item: render it
  // as a normal component in the item scope rather than re-dispatching it back
  // to `ListRenderer` (which would recurse forever).
  asListItem?: boolean;
};

const RecursiveRendererImpl = ({
  elementKey,
  scopes,
  init,
  fallback,
  asListItem = false,
}: RecursiveRendererProps): React.ReactElement => {
  // Subscribe to THIS node's element only. Re-renders when this key's entry
  // streams in / changes — never because a sibling or unrelated entry did.
  const element = useElement(elementKey);
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const hasBeenRenderedRef = useRef(false);
  const setDefaultsPromiseRef = useRef<Promise<void> | null>(null);
  const { implementations, systemVisuals, functions } = useRendererRegistry();

  // A list entry reached as a child slot must render as a LIST (iterate items);
  // the same entry reached per-item (`asListItem`) renders as a normal
  // component in the item scope.
  const isListContainer = !!element && isComponentListEntry(element) && !asListItem;

  // Reactive subscriptions. The dep set is auto-derived from the entry's own
  // expression text via static AST walk — `extractDeps` walks every
  // `props.expr` / `hidden` for `scopes.X.Y` reads. Skipped while the entry
  // hasn't streamed in, and for the list-container pass (ListRenderer owns the
  // list's own deps).
  useEffect(() => {
    if (!element || isListContainer) return () => {};
    const deps = extractDeps(element);
    if (deps.length === 0) return () => {};

    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      const [targetScope, targetPath] = parseScope(dep);
      const targetScopeProxy = scopes[targetScope];
      // Item-scoped entries render before their item proxy is wired into the
      // scopes map for the very first time on a fresh list — guard so we don't
      // crash on a missing scope key. The next render after mount catches up.
      if (!targetScopeProxy) continue;

      const unsubscribe = targetScopeProxy.$emitter.on(targetPath, () => {
        forceRender();
      });
      unsubscribers.push(unsubscribe);
    }
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [element, scopes, isListContainer]);

  // Not streamed yet — show the parent-provided placeholder (or registry
  // default). The child component instance stays mounted; when its entry
  // arrives, the `useElement` subscription wakes it and it renders for real.
  if (!element) {
    const Fallback = fallback ?? systemVisuals?.placeholder ?? NullPlaceholder;
    return <Fallback />;
  }

  // List container → hand off to ListRenderer.
  if (isListContainer) {
    return <ListRenderer elementKey={elementKey} scopes={scopes} />;
  }

  const implEntry = implementations[element.component];
  const Component = implEntry?.render;
  if (!Component) {
    const Unknown = systemVisuals?.unknown ?? DefaultUnknown;
    return (
      <Unknown componentName={element.component} elementKey={elementKey} />
    );
  }

  const Placeholder =
    implEntry?.placeholder ?? systemVisuals?.placeholder ?? NullPlaceholder;

  // `element.children?.length` — Prisma rehydrates an unset `children` column
  // as `[]` rather than `null`, so the truthy `[]` would otherwise leak past
  // this guard and produce an empty React-children array. Downstream that
  // empty array clobbers any `children` value supplied through `entry.props`
  // (createComponentImplementation spreads it second). Collapse to `null` for leaf
  // entries so the props-supplied children survive.
  //
  // Each child is rendered unconditionally as its own slot — the child decides
  // for itself whether it's pending (placeholder), a list, or a normal entry by
  // reading its own element from the store. That's why streaming a child in
  // doesn't re-render this parent: the slot is already mounted, and the child's
  // own subscription wakes it.
  const children = element.children?.length
    ? element.children.map((childKey: string) => (
        <RecursiveRenderer
          key={childKey}
          elementKey={childKey}
          scopes={scopes}
          fallback={Placeholder}
        />
      ))
    : null;

  if ((element.defaults || init) && !hasBeenRenderedRef.current) {
    // Defaults and init both run on this single mount. They share the same
    // async pipeline: any Promise-returning entry forces the whole block onto
    // Suspense via `setDefaultsPromiseRef`, so children mount after every seed
    // (LLM-driven and host-driven) resolves.
    type DefaultEntry = {
      kind: "default";
      targetScope: string;
      targetPath: string;
      value: unknown;
    };
    type InitEntry = { kind: "init"; value: Promise<unknown> };
    const collected: Array<DefaultEntry | InitEntry> = [];
    let hasAsync = false;
    element.defaults?.forEach((setExpr) => {
      if (setExpr.set) {
        const value = evaluate(setExpr, { scopes }, { functions });
        const [targetScope, targetPath] = parseScope(setExpr.set);
        if (value instanceof Promise) {
          hasAsync = true;
        }
        collected.push({ kind: "default", targetScope, targetPath, value });
      }
    });
    if (init) {
      // The host's init function writes through the reactive Proxy directly
      // (`scopes.root.foo = x`). Sync writes have already landed by the time
      // `init(...)` returns; we only need to track the Promise (if any) so
      // children Suspend until async writes complete.
      const initResult = init({ scopes });
      if (initResult instanceof Promise) {
        hasAsync = true;
        collected.push({ kind: "init", value: initResult });
      }
    }
    if (hasAsync) {
      setDefaultsPromiseRef.current = Promise.all(
        collected.map(async (entry) => {
          if (entry.kind === "init") {
            await entry.value;
            return;
          }
          scopes[entry.targetScope].$set(entry.targetPath, await entry.value, {
            default: true,
          });
        }),
      ).then(() => {
        setTimeout(() => {
          setDefaultsPromiseRef.current = null;
        }, 0);
      });
    } else {
      for (const entry of collected) {
        if (entry.kind === "default") {
          scopes[entry.targetScope].$set(entry.targetPath, entry.value, {
            default: true,
          });
        }
        // Sync init writes have already landed via the Proxy `set` trap —
        // nothing further to do here.
      }
    }
    hasBeenRenderedRef.current = true;
  }

  if (setDefaultsPromiseRef.current) {
    const p = setDefaultsPromiseRef.current;
    const Comp = () => {
      use(p!);
      return (
        <Component entry={element} scopes={scopes}>
          {children}
        </Component>
      );
    };
    return (
      <ErrorBoundary errorComponent={systemVisuals?.error} elementKey={elementKey}>
        <Suspense
          fallback={
            <Component entry={element} scopes={scopes}>
              <Placeholder />
            </Component>
          }
        >
          <Comp />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary errorComponent={systemVisuals?.error} elementKey={elementKey}>
      <Component entry={element} scopes={scopes}>
        {children}
      </Component>
    </ErrorBoundary>
  );
};

// Plain shallow memo. Props are stabilised by callers (`scopes` via useMemo,
// `fallback`/`init`/`asListItem` are stable references), so the only thing that
// re-renders a node is its own `useElement` subscription or its own reactive
// `forceRender` — never an unrelated parent re-render. This is what makes a
// settled subtree render exactly once while siblings stream in.
export const RecursiveRenderer = memo(RecursiveRendererImpl);

const getItemId = (
  keyBy: string | undefined,
  item: unknown,
  index: number,
): string | number => {
  const key = keyBy ?? "_index";
  if (key === "_index") return index;
  if (key === "_item") return item as string | number;
  return ((item as Record<string, unknown>)?.[key] ?? index) as string | number;
};

const ListRendererImpl = ({
  elementKey,
  scopes,
}: {
  elementKey: string;
  scopes: Scopes;
}): React.ReactElement => {
  const element = useElement(elementKey);
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const { functions, systemVisuals } = useRendererRegistry();
  // Cache item proxies + item scopes by unique ID to preserve state across
  // re-renders AND to hand each item a STABLE `scopes` prop — without that the
  // per-item RecursiveRenderer could never memo-bail when the list re-renders.
  const itemProxiesRef = useRef<
    Map<string | number, ReturnType<typeof createProxyScope>>
  >(new Map());
  const itemScopesRef = useRef<Map<string | number, Scopes>>(new Map());
  // Remember the (item value, index) each cached scope was built for, so we can
  // rebuild (→ new identity → item re-renders) only when an item's data or
  // position actually changed.
  const itemMetaRef = useRef<Map<string | number, { item: unknown; index: number }>>(
    new Map(),
  );
  // If the parent scope identity changes, every cached item scope is stale.
  const prevScopesRef = useRef<Scopes | null>(null);

  // Reactive subscriptions for the list entry. Auto-derived from the entry's
  // expressions — `each` plus any `props.expr` / `hidden` on the list itself.
  useEffect(() => {
    if (!element) return () => {};
    const deps = extractDeps(element);
    if (deps.length === 0) return () => {};

    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      const [targetScope, targetPath] = parseScope(dep);
      const targetScopeProxy = scopes[targetScope];
      if (!targetScopeProxy) continue;

      const unsubscribe = targetScopeProxy.$emitter.on(targetPath, () => {
        forceRender();
      });
      unsubscribers.push(unsubscribe);
    }
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [element, scopes]);

  if (!element) return <></>;

  if (!isComponentListEntry(element)) {
    // A key that mounted as a list was replaced by a non-list element — an
    // invariant break, surfaced through the same `error` slot as render throws.
    const ErrorComponent = systemVisuals?.error ?? DefaultErrorComponent;
    return (
      <ErrorComponent
        error={new Error(`Element is not a list: ${elementKey}`)}
        elementKey={elementKey}
      />
    );
  }

  const line = element;

  // Parent scope changed → drop the whole item-scope cache.
  if (prevScopesRef.current !== scopes) {
    itemScopesRef.current.clear();
    itemMetaRef.current.clear();
    prevScopesRef.current = scopes;
  }

  const items =
    (evaluate({ expr: line.each }, { scopes }, { functions }) as unknown[]) ??
    [];

  // Clean up proxies/scopes for removed items (by ID)
  const currentIds = new Set(
    items.map((item, index) => getItemId(line.keyBy, item, index)),
  );
  itemProxiesRef.current.forEach((_, id) => {
    if (!currentIds.has(id)) {
      itemProxiesRef.current.delete(id);
      itemScopesRef.current.delete(id);
      itemMetaRef.current.delete(id);
    }
  });

  const lastScope = scopes[Object.keys(scopes)[Object.keys(scopes).length - 1]];

  const childrenAndScopes = items.map((item, index) => {
    // Use item's id if available, otherwise fall back to index
    const itemId = getItemId(line.keyBy, item, index);

    // Reuse existing proxy or create a new one (keyed by ID)
    const existingProxy = itemProxiesRef.current.get(itemId);

    const itemProxy =
      existingProxy ??
      (() => {
        // Create new proxy for new items
        const itemData = { item, index, id: itemId };
        const newProxy = createProxyScope(itemData);
        itemProxiesRef.current.set(itemId, newProxy);
        return newProxy;
      })();

    // Always update the item data and index in case items were edited or shifted
    (itemProxy as any).item = item;
    (itemProxy as any).index = index;

    // Rebuild the item's scopes object (→ new identity → the item re-renders)
    // only when its value or index changed; otherwise reuse the cached one so
    // the per-item RecursiveRenderer's `React.memo` bails on unrelated list
    // re-renders (e.g. a sibling item changing, or an ancestor streaming in).
    const prevMeta = itemMetaRef.current.get(itemId);
    let itemScopes = itemScopesRef.current.get(itemId);
    if (!itemScopes || !prevMeta || prevMeta.item !== item || prevMeta.index !== index) {
      itemScopes = { ...scopes, [line.as]: itemProxy };
      itemScopesRef.current.set(itemId, itemScopes);
      itemMetaRef.current.set(itemId, { item, index });
    }

    return [
      <RecursiveRenderer
        key={`${elementKey}-item-${itemId}`}
        elementKey={elementKey}
        scopes={itemScopes}
        asListItem
      />,
      itemProxy,
    ] as const;
  });

  const children = childrenAndScopes.map(([child]) => child);
  const itemScopesList = childrenAndScopes.map(([, scope]) => scope);

  lastScope.$set(`childScopes.${line.as}`, itemScopesList);

  return <>{children}</>;
};

export const ListRenderer = memo(ListRendererImpl);

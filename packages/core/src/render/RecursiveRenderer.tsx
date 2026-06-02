"use client";
import React, {
  Suspense,
  use,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { createProxyScope } from "../scope/createProxyScope";
import type { ChunkComponent, ChunkComponentList } from "../types";
import { useRendererRegistry } from "./RendererRegistry";
import { evaluate } from "../eval/evaluate";
import { extractDeps } from "../eval/extractDeps";
import { parseScope } from "../scope/parseScope";
import { ErrorBoundary } from "./ErrorBoundary";
import type { InitFn } from "./Fragment";

export const RecursiveRenderer = ({
  elementKey,
  elements,
  scopes,
  init,
}: {
  elementKey: string;
  elements: Record<string, ChunkComponent>;
  scopes: Record<string, ReturnType<typeof createProxyScope>>;
  // One-shot side-effect callback. Set ONLY for the top-level mount of
  // the synthetic Fragment wrapper that `createAIComponentRenderers`
  // builds; recursive child mounts below intentionally omit this prop so
  // descendants never re-fire `init`. Sync writes via the reactive Proxy
  // (e.g. `scopes.root.x = 1`) land immediately; async returns join the
  // existing `setDefaultsPromiseRef` Suspense pipeline.
  init?: InitFn;
}): React.ReactElement => {
  const element = elements[elementKey];
  const [, forceRender] = useReducer((x: number): number => x + 1, 0);
  const hasBeenRenderedRef = React.useRef(false);
  const setDefaultsPromiseRef = useRef<Promise<void> | null>(null);
  const { renderers, defaultPlaceholder, functions } = useRendererRegistry();

  // Reactive subscriptions. The dep set is auto-derived from the chunk's
  // own expression text via static AST walk — `extractDeps` walks every
  // `props.expr` / `hidden.expr` (and `each` on list chunks) for
  // `scopes.X.Y` reads.
  useEffect(() => {
    if (!element) return () => {};
    const deps = extractDeps(element);
    if (deps.length === 0) return () => {};

    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      const [targetScope, targetPath] = parseScope(dep);
      const targetScopeProxy = scopes[targetScope];
      // Item-scoped chunks render before their item proxy is wired into
      // the scopes map for the very first time on a fresh list — guard
      // so we don't crash on a missing scope key. The next render after
      // mount will catch up.
      if (!targetScopeProxy) continue;

      const unsubscribe = targetScopeProxy.$emitter.on(
        targetPath,
        (newValue: unknown) => {
          console.log(`Dependency changed: ${dep} =`, newValue);
          forceRender();
        },
      );
      unsubscribers.push(unsubscribe);
    }
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [element, scopes]);

  if (!element) return <></>;

  const rendererEntry = renderers[element.component];
  const Component = rendererEntry?.component;
  if (!Component)
    return (
      <div className="text-red-500" data-key={elementKey}>
        Unknown component: {element.component}
      </div>
    );

  const Placeholder =
    rendererEntry?.placeholder ?? defaultPlaceholder ?? (() => null);

  // `element.children?.length` — Prisma rehydrates an unset `children` column
  // as `[]` rather than `null`, so the truthy `[]` would otherwise leak past
  // this guard and produce an empty React-children array. Downstream that
  // empty array clobbers any `children` value supplied through `chunk.props`
  // (createAIComponentRenderer spreads it second). Collapse to `null` for
  // leaf chunks so the props-supplied children survive.
  const children = element.children?.length
    ? element.children.map((childKey: string) => {
        const childElement = elements[childKey];
        if (!childElement) {
          return <Placeholder key={childKey} />;
        }
        if ("each" in childElement) {
          return (
            <ListRenderer
              key={childKey}
              elementKey={childKey}
              elements={elements}
              scopes={scopes}
              line={childElement}
            />
          );
        }
        return (
          <RecursiveRenderer
            key={childKey}
            elementKey={childKey}
            elements={elements}
            scopes={scopes}
          />
        );
      })
    : null;

  if ((element.defaults || init) && !hasBeenRenderedRef.current) {
    // Defaults and init both run on this single mount. They share the
    // same async pipeline: any Promise-returning entry forces the whole
    // block onto Suspense via `setDefaultsPromiseRef`, so children mount
    // after every seed (LLM-driven and host-driven) resolves.
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
      // The host's init function writes through the reactive Proxy
      // directly (`scopes.root.foo = x`). Sync writes have already
      // landed by the time `init(...)` returns; we only need to track
      // the Promise (if any) so children Suspend until async writes
      // complete.
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
        // Sync init writes have already landed via the Proxy `set`
        // trap — nothing further to do here.
      }
    }
    hasBeenRenderedRef.current = true;
  }

  if (setDefaultsPromiseRef.current) {
    const p = setDefaultsPromiseRef.current;
    const Comp = () => {
      use(p!);
      return (
        <Component chunk={element} scopes={scopes}>
          {children}
        </Component>
      );
    };
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <Component chunk={element} scopes={scopes}>
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
    <ErrorBoundary>
      <Component chunk={element} scopes={scopes}>
        {children}
      </Component>
    </ErrorBoundary>
  );
};

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

export const ListRenderer = ({
  elementKey,
  elements,
  scopes,
  line,
}: {
  elementKey: string;
  elements: Record<string, ChunkComponent>;
  scopes: Record<string, ReturnType<typeof createProxyScope>>;
  line: ChunkComponentList;
}): React.ReactElement => {
  const element = elements[elementKey];
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const { functions } = useRendererRegistry();
  // Cache item proxies by unique ID to preserve state across re-renders
  const itemProxiesRef = React.useRef<
    Map<string | number, ReturnType<typeof createProxyScope>>
  >(new Map());

  if (!element) return <></>;

  if (!("each" in element))
    return (
      <div className="text-red-500">Element is not a list: {elementKey}</div>
    );

  // Reactive subscriptions for the list chunk. Auto-derived from the chunk's
  // expressions — `each` plus any `props.expr` / `hidden.expr` on the
  // list itself. The old code parseScope-d `each` directly and only
  // subscribed to the leading static segment, which silently dropped reads
  // from filter/map sub-expressions (e.g. `scopes.inv.rows.filter(r =>
  // r.name.includes(scopes.root.searchTerm))` only ever woke on
  // `inv.rows` changes, never on `searchTerm` — broke live search).
  useEffect(() => {
    const deps = extractDeps(element);
    if (deps.length === 0) return () => {};

    const unsubscribers: (() => void)[] = [];
    for (const dep of deps) {
      const [targetScope, targetPath] = parseScope(dep);
      const targetScopeProxy = scopes[targetScope];
      if (!targetScopeProxy) continue;

      const unsubscribe = targetScopeProxy.$emitter.on(targetPath, () => {
        console.log(`List dep changed: ${dep}`);
        forceRender();
      });
      unsubscribers.push(unsubscribe);
    }
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [element, scopes]);

  console.log(
    `Rendering ListRenderer for ${elementKey} with each: ${line.each}`,
  );

  const items =
    (evaluate({ expr: line.each }, { scopes }, { functions }) as unknown[]) ??
    [];

  // Clean up proxies for removed items (by ID)
  const currentIds = new Set(
    items.map((item, index) => getItemId(line.keyBy, item, index)),
  );
  itemProxiesRef.current.forEach((_, id) => {
    if (!currentIds.has(id)) {
      itemProxiesRef.current.delete(id);
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

    const itemScopes = {
      ...scopes,
      [line.as]: itemProxy,
    };

    return [
      <RecursiveRenderer
        key={`${elementKey}-item-${itemId}`}
        elementKey={elementKey}
        elements={elements}
        scopes={itemScopes}
      />,
      itemProxy,
    ];
  });

  const children = childrenAndScopes.map(([child]) => child);
  const itemScopesList = childrenAndScopes.map(([, scope]) => scope);

  lastScope.$set(`childScopes.${line.as}`, itemScopesList);

  return <>{children}</>;
};

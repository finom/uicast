import { Activity, memo, Suspense, use, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import { type ComponentListEntry, EntryError, type EntryErrorReason } from "@uicast/core";
import {
  isComponentListEntry,
  entryShapeError,
  evaluate,
  findEntrySetAddressFault,
  setAddressError,
} from "@uicast/core/internal";
import { engineOf } from "../impl/engine";
import { structurallyEqual } from "../impl/structural-equal";
import { useConfirm } from "../providers/confirm";
import { ErrorBoundary } from "../providers/error-boundary";
import { useRendererRegistry } from "../store/renderer-registry";
import { useElement } from "../store/elements-store";
import { SubtreeSkeleton } from "./document-skeleton";
import { refusePromise } from "../refuse-promise";
import type { Debouncers, InitFn, RenderContext, Scopes } from "../types";
import { useReactiveDeps } from "./use-reactive-deps";
import { type SeedFailure, useSeed } from "./use-seed";
import { useItemScopes } from "./use-item-scopes";

function SuspendUntil({
  promise,
  onServerFailure,
  children,
}: {
  promise: Promise<SeedFailure | undefined>;
  onServerFailure: (error: unknown) => void;
  children: ReactNode;
}): ReactElement {
  const failure = use(promise);
  // A server pass renders the parent once, so it never rethrows the failure; this throw sends the skeleton instead.
  if (failure && typeof window === "undefined") {
    onServerFailure(failure.error);
    throw failure.error;
  }
  return <>{children}</>;
}

// A rejected Suspense promise does not reliably reach a boundary through `use()`, so the seed error is rethrown in render.
function ThrowError({ error }: { error: unknown }): never {
  throw error;
}

const NO_CALLBACKS: Record<string, (evt: unknown) => Promise<void>> = {};

type EntryRendererProps = {
  elementKey: string;
  scopes: Scopes;
  // Set only on the synthetic RootFragment, so `init` fires once.
  init?: InitFn;
  // The parent's own skeleton, so the slot looks unchanged.
  fallback?: ReactNode;
  // Keys of every ancestor — a repeat means the children reference in a cycle.
  ancestors?: ReadonlySet<string>;
  // Rendering once per list item; without it the element would dispatch back to ListEntryRenderer forever.
  asListItem?: boolean;
};

const EntryRendererInner = ({
  elementKey,
  scopes,
  init,
  fallback,
  asListItem = false,
  ancestors,
}: EntryRendererProps): ReactElement => {
  if (ancestors?.has(elementKey)) {
    throw new EntryError(`"${elementKey}" is its own ancestor — the children form a cycle`, {
      reason: "guardrail-violation",
      elementKey,
    });
  }
  const lineage = useMemo(() => new Set([...(ancestors ?? []), elementKey]), [ancestors, elementKey]);
  const element = useElement(elementKey);
  const { implementations, fallbackComponents, evaluator, urlPolicy, onError } = useRendererRegistry();
  const confirm = useConfirm();

  // A malformed line fails in its own slot, and none of its fields is read.
  const shapeError = useMemo(() => (element ? entryShapeError(element) : null), [element]);

  // Reached per item (`asListItem`), a list entry renders as a normal component in the item scope.
  const isListContainer = !!element && isComponentListEntry(element) && !asListItem;

  const impl = element ? implementations[element.component] : undefined;
  const engine = impl ? engineOf(impl) : undefined;
  const willRender = !!element && !isListContainer && !!impl;
  // Seed and init run on the element's own pass, never per item.
  const seedEnabled = !asListItem && !shapeError && (isListContainer || willRender);

  // The container pass leaves the list's deps to ListEntryRenderer.
  useReactiveDeps(isListContainer || shapeError ? undefined : element, scopes, "render");
  const { pending, error: seedError } = useSeed({
    element,
    scopes,
    init,
    evaluator,
    enabled: seedEnabled,
  });

  // A fault is thrown below, inside this element's own boundary, so the hook order never changes.
  let props: unknown = null;
  let hidden: unknown = false;
  let loading: unknown = false;
  let fault: unknown = null;
  if (element && engine && !isListContainer && !shapeError) {
    try {
      ({ props, hidden, loading } = engine.evaluate(element, scopes, evaluator, urlPolicy));
    } catch (err) {
      fault = err;
    }
  }
  // Same data, same object, so `Render` skips a state change that left these props untouched.
  const prevProps = useRef(props);
  if (structurallyEqual(prevProps.current, props)) props = prevProps.current;
  else prevProps.current = props;

  // Pending debounced runs outlive a handler rebuild, not the element.
  const debouncers = useRef<Debouncers>(new Map());
  useEffect(() => {
    const runs = debouncers.current;
    return () => {
      for (const run of runs.values()) run.cancel();
    };
  }, []);
  const callbacks = useMemo(
    () =>
      element && engine && !isListContainer && !shapeError
        ? engine.callbacks(element, scopes, confirm, evaluator, onError, debouncers.current)
        : NO_CALLBACKS,
    [element, engine, isListContainer, shapeError, scopes, confirm, evaluator, onError],
  );

  const isLoading = Boolean(loading);
  const context = useMemo(
    () => (element ? { entry: element, loading: isLoading, scopes } : null),
    [element, isLoading, scopes],
  );

  const Skeleton = impl?.skeleton ?? fallbackComponents?.defaultSkeleton;
  // What each child's slot shows until that child's entry streams in.
  const slotSkeleton = useMemo(
    () => (Skeleton && element ? <Skeleton reason="streaming" entry={element} /> : null),
    [Skeleton, element],
  );

  // Stable across this node's own re-renders, so the impl's props memo holds.
  const childKeys = shapeError ? undefined : element?.children;
  const children = useMemo(
    () =>
      childKeys?.length
        ? childKeys.map((childKey) => (
            <EntryRenderer
              key={childKey}
              elementKey={childKey}
              scopes={scopes}
              fallback={slotSkeleton}
              ancestors={lineage}
            />
          ))
        : null,
    [childKeys, scopes, slotSkeleton, lineage],
  );

  // The slot stays mounted; `useElement` wakes it when the entry arrives.
  if (!element) {
    return <>{fallback}</>;
  }

  // Checked at first render, so the fault surfaces while the model is still streaming.
  const invalidSet = shapeError ? null : findEntrySetAddressFault(element);
  const lineError = invalidSet ? setAddressError(invalidSet.set, invalidSet.fault, elementKey) : shapeError;
  if (lineError) {
    return (
      <ErrorBoundary
        errorComponent={fallbackComponents?.error}
        elementKey={elementKey}
        resetToken={element}
        onError={onError}
      >
        <ThrowError error={lineError} />
      </ErrorBoundary>
    );
  }

  // `reason` matches the element's boundary, so a server report classifies the error as the browser would.
  const afterSeed = (content: ReactNode, whileSeeding: ReactNode, reason?: EntryErrorReason): ReactNode => {
    if (seedError) return <ThrowError error={seedError} />;
    if (!pending) return content;
    const report = (error: unknown) => onError?.(EntryError.wrap(error, reason ?? "unknown", elementKey));
    return (
      <Suspense fallback={whileSeeding}>
        <SuspendUntil promise={pending} onServerFailure={report}>
          {content}
        </SuspendUntil>
      </Suspense>
    );
  };

  if (isListContainer) {
    // A boundary here, so a bad list expression latches the list slot, not the parent's subtree.
    return (
      <ErrorBoundary
        errorComponent={fallbackComponents?.error}
        elementKey={elementKey}
        resetToken={pending ?? element}
        onError={onError}
      >
        {afterSeed(
          <ListEntryRenderer list={element} scopes={scopes} ancestors={ancestors} />,
          <SubtreeSkeleton elementKey={elementKey} />,
        )}
      </ErrorBoundary>
    );
  }

  if (!impl || !engine) {
    // Routed through the boundary, so a re-emission with a real name recovers it.
    return (
      <ErrorBoundary
        errorComponent={fallbackComponents?.error}
        elementKey={elementKey}
        resetToken={element}
        onError={onError}
      >
        <ThrowError
          error={
            new EntryError(`Unknown component: ${element.component}`, {
              reason: "unknown-component",
              elementKey,
            })
          }
        />
      </ErrorBoundary>
    );
  }

  const { Render } = engine;
  const rendered = (slot: ReactNode) => {
    const result = (
      <Render
        {...(props as object)}
        {...callbacks}
        {...(slot ? { children: slot } : {})}
        __context={context as RenderContext}
      />
    );
    if (!element.hidden) return result;
    return <Activity mode={hidden ? "hidden" : "visible"}>{result}</Activity>;
  };
  const content = fault !== null ? <ThrowError error={fault} /> : rendered(children);

  // Props already passed the def's schema, so a throw from `Render` is the implementation's.
  return (
    <ErrorBoundary
      errorComponent={fallbackComponents?.error}
      elementKey={elementKey}
      // While an async seed is in flight the token is the batch promise, so the latch clears when the seed settles.
      resetToken={pending ?? element}
      onError={onError}
      reason="implementation"
    >
      {afterSeed(
        content,
        // Props may read the data still loading, so the skeleton never reads them.
        hidden ? null : <SubtreeSkeleton elementKey={elementKey} visible />,
        "implementation",
      )}
    </ErrorBoundary>
  );
};

export const EntryRenderer = memo(EntryRendererInner);

const ListEntryRendererInner = ({
  list,
  scopes,
  ancestors,
}: {
  list: ComponentListEntry;
  scopes: Scopes;
  ancestors?: ReadonlySet<string>;
}): ReactElement => {
  const { evaluator } = useRendererRegistry();
  useReactiveDeps(list, scopes, "each");

  const rawItems = evaluate({ expr: list.each }, { scopes }, evaluator);
  refusePromise(rawItems, "each", list.key);
  const items = rawItems ?? [];
  if (!Array.isArray(items)) {
    throw new EntryError(`List "each" must evaluate to an array, got ${typeof items}: ${list.each}`, {
      reason: "invalid-list",
      elementKey: list.key,
    });
  }
  const rows = useItemScopes(scopes, list, items);

  return (
    <>
      {rows.map(({ itemId, itemScopes }) => (
        <EntryRenderer
          key={`${list.key}-item-${itemId}`}
          elementKey={list.key}
          scopes={itemScopes}
          asListItem
          ancestors={ancestors}
        />
      ))}
    </>
  );
};

const ListEntryRenderer = memo(ListEntryRendererInner);

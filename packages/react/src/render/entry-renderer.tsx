import { type ComponentListEntry, EntryError, type EntryErrorReason } from "@uicast/core";
import { entrySetAddressError, entryShapeError, evaluate, isComponentListEntry } from "@uicast/core/internal";
import { Activity, memo, type ReactElement, type ReactNode, Suspense, use, useEffect, useMemo, useRef } from "react";
import { refusePromise } from "../guards";
import { engineOf } from "../impl/engine";
import { useConfirm } from "../providers/confirm";
import { slotId, useElement, useSlot } from "../providers/elements-store";
import { ErrorBoundary } from "../providers/error-boundary";
import { useRendererRegistry } from "../providers/renderer-provider";
import type { Debouncers, InitFn, RenderContext, Scopes } from "../types";
import { SubtreeSkeleton } from "./document-skeleton";
import { structurallyEqual } from "./structural-equal";
import { useItemScopes } from "./use-item-scopes";
import { useReactiveDeps } from "./use-reactive-deps";
import { type SeedFailure, useSeed } from "./use-seed";

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
  // The parent's `children` slot this renders in; unset for the root and for list items.
  slot?: string;
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
  // Seed and init run on the element's own pass, never per item, and only for an element that renders.
  const seedEnabled = !!element && !asListItem && !shapeError && (isListContainer || !!impl);

  // The container pass leaves the list's deps to ListEntryRenderer.
  useReactiveDeps(isListContainer || shapeError ? undefined : element, scopes, "render");
  const { pending, error: seedError } = useSeed({ element, scopes, init, evaluator, enabled: seedEnabled });

  // A fault is thrown below, inside this element's own boundary, so the hook order never changes.
  let props: unknown = null;
  let hidden: unknown = false;
  let busy: unknown = false;
  let fault: unknown = null;
  if (element && engine && !isListContainer && !shapeError) {
    try {
      ({ props, hidden, busy } = engine.evaluate(element, scopes, evaluator, urlPolicy));
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

  const isBusy = Boolean(busy);
  const context = useMemo(() => (element ? { entry: element, busy: isBusy, scopes } : null), [element, isBusy, scopes]);

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
        ? childKeys.map((childKey, index) => (
            <EntryRenderer
              // A repeated key needs its own React key; the first keeps the plain one, so a reorder keeps state.
              key={childKeys.indexOf(childKey) === index ? childKey : `${childKey}#${index}`}
              elementKey={childKey}
              scopes={scopes}
              fallback={slotSkeleton}
              ancestors={lineage}
              slot={slotId(elementKey, index)}
            />
          ))
        : null,
    [childKeys, scopes, slotSkeleton, lineage, elementKey],
  );

  // The slot stays mounted; `useElement` wakes it when the entry arrives.
  if (!element) return <>{fallback}</>;

  // A latched error clears when `resetToken` changes: a re-emitted key is a fresh entry object.
  const boundary = (content: ReactNode, resetToken: unknown = element, reason?: EntryErrorReason) => (
    <ErrorBoundary
      errorComponent={fallbackComponents?.error}
      elementKey={elementKey}
      resetToken={resetToken}
      onError={onError}
      reason={reason}
    >
      {content}
    </ErrorBoundary>
  );

  // Checked at first render, so the fault surfaces while the model is still streaming.
  const lineError = shapeError ?? entrySetAddressError(element);
  if (lineError) return boundary(<ThrowError error={lineError} />);

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

  // A boundary of its own, so a bad list expression latches the list slot, not the parent's subtree.
  // While an async seed is in flight the token is the batch promise, so the latch clears when the seed settles.
  if (isListContainer) {
    return boundary(
      afterSeed(
        <ListEntryRenderer list={element} scopes={scopes} ancestors={ancestors} />,
        <SubtreeSkeleton elementKey={elementKey} />,
      ),
      pending ?? element,
    );
  }

  // Routed through the boundary, so a re-emission with a real name recovers it.
  if (!impl || !engine) {
    const error = new EntryError(`Unknown component: ${element.component}`, {
      reason: "unknown-component",
      elementKey,
    });
    return boundary(<ThrowError error={error} />);
  }

  const { Render } = engine;
  let content: ReactNode;
  if (fault !== null) content = <ThrowError error={fault} />;
  else {
    content = (
      <Render
        {...(props as object)}
        {...callbacks}
        {...(children ? { children } : {})}
        __context={context as RenderContext}
      />
    );
    if (element.hidden) content = <Activity mode={hidden ? "hidden" : "visible"}>{content}</Activity>;
  }

  // Props already passed the def's schema, so a throw from `Render` is the implementation's.
  // Props may read the data still loading, so the skeleton never reads them.
  return boundary(
    afterSeed(content, hidden ? null : <SubtreeSkeleton elementKey={elementKey} visible />, "implementation"),
    pending ?? element,
    "implementation",
  );
};

// A key listed in a second place renders only in the first: repeated listings would multiply the subtree.
const RepeatedListing = ({ elementKey, renderedIn }: { elementKey: string; renderedIn?: string }): ReactElement => {
  const { fallbackComponents, onError } = useRendererRegistry();
  const parent = renderedIn?.slice(renderedIn.indexOf(":") + 1);
  const error = new EntryError(
    `"${elementKey}" already renders under "${parent}": an entry is listed in children once`,
    { reason: "guardrail-violation", elementKey },
  );
  return (
    <ErrorBoundary
      errorComponent={fallbackComponents?.error}
      elementKey={elementKey}
      resetToken={renderedIn}
      onError={onError}
      reason="guardrail-violation"
    >
      <ThrowError error={error} />
    </ErrorBoundary>
  );
};

// A separate component, so a listing that takes over the slot mounts the element fresh.
const SlottedEntryRenderer = (props: EntryRendererProps): ReactElement => {
  const renderedIn = useSlot(props.elementKey);
  // A cycle repeats a key too; the inner renderer names it as a cycle.
  if (props.slot !== undefined && props.slot !== renderedIn && !props.ancestors?.has(props.elementKey)) {
    return <RepeatedListing elementKey={props.elementKey} renderedIn={renderedIn} />;
  }
  return <EntryRendererInner {...props} />;
};

export const EntryRenderer = memo(SlottedEntryRenderer);

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

  // The rows would hide the scope of that name.
  const taken = [list.as, `$${list.as}`].find((name) => Object.hasOwn(scopes, name));
  if (taken) {
    throw new EntryError(`List "as" must name a new scope, but "scopes.${taken}" already exists here`, {
      reason: "invalid-list",
      elementKey: list.key,
    });
  }

  const rawItems = evaluate({ expr: list.each }, { scopes }, evaluator);
  refusePromise(rawItems, "each", list.key);
  const items = rawItems ?? [];
  if (!Array.isArray(items)) {
    throw new EntryError(`List "each" must evaluate to an array, got ${typeof items}: ${list.each}`, {
      reason: "invalid-list",
      elementKey: list.key,
    });
  }
  const rows = useItemScopes(scopes, list, items, evaluator.memberReads(list.each, "scopes"));

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

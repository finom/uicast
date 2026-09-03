"use client";
import React, { Activity, memo, Suspense, use, useEffect, useMemo, useRef, type ReactNode } from "react";
import { EntryError } from "@uicast/core";
import {
  isComponentListEntry,
  evaluate,
  findEntrySetAddressFault,
  setAddressError,
} from "@uicast/core/internal";
import { structurallyEqual } from "../impl/structural-equal";
import { useConfirm } from "../providers/confirm";
import { ErrorBoundary } from "../providers/error-boundary";
import { useRendererRegistry } from "../store/renderer-registry";
import { useElement } from "../store/elements-store";
import type { Debouncers, InitFn, PlaceholderComponentProps, Scopes } from "../types";
import { useReactiveDeps } from "./use-reactive-deps";
import { useSeed } from "./use-seed";
import { useItemScopes } from "./use-item-scopes";

type PlaceholderComponent = (
  props: PlaceholderComponentProps,
) => React.ReactElement | null;

const NullPlaceholder: PlaceholderComponent = () => null;

function SuspendUntil({
  promise,
  children,
}: {
  promise: Promise<void>;
  children: ReactNode;
}): React.ReactElement {
  use(promise);
  return <>{children}</>;
}

// Rethrows a seed failure during render, inside the element's own error
// boundary — the deterministic route to the `error` slot (a rejected Suspense
// promise doesn't reliably reach a boundary through `use()`).
function ThrowError({ error }: { error: unknown }): never {
  throw error;
}

const NO_CALLBACKS: Record<string, (evt: unknown) => Promise<void>> = {};

type EntryRendererProps = {
  elementKey: string;
  scopes: Scopes;
  // Set only on the synthetic RootFragment mount, so `init` fires once and
  // descendants never re-fire it.
  init?: InitFn;
  // Shown while this node's entry hasn't streamed in; the parent passes its own
  // placeholder so the slot looks unchanged.
  fallback?: PlaceholderComponent;
  // Keys of every ancestor — a repeat means the children reference in a cycle.
  ancestors?: ReadonlySet<string>;
  // Set when rendering an element once per list item: render it normally instead
  // of dispatching back to ListEntryRenderer (which would recurse forever).
  asListItem?: boolean;
};

const EntryRendererInner = ({
  elementKey,
  scopes,
  init,
  fallback,
  asListItem = false,
  ancestors,
}: EntryRendererProps): React.ReactElement => {
  if (ancestors?.has(elementKey)) {
    throw new EntryError(`"${elementKey}" is its own ancestor — the children form a cycle`, {
      reason: "guardrail-violation",
      elementKey,
    });
  }
  const lineage = useMemo(() => new Set([...(ancestors ?? []), elementKey]), [ancestors, elementKey]);
  // This node's element only — re-renders when this key changes, not a sibling.
  const element = useElement(elementKey);
  const { implementations, fallbackComponents, evaluator, urlPolicy, onError } = useRendererRegistry();
  const confirm = useConfirm();

  // A list entry reached as a child slot iterates its items; reached per-item
  // (`asListItem`) it renders as a normal component in the item scope.
  const isListContainer = !!element && isComponentListEntry(element) && !asListItem;

  const impl = element ? implementations[element.component] : undefined;
  // Whether this pass renders the real component (vs. placeholder / list / unknown).
  const willRender = !!element && !isListContainer && !!impl;
  // One-shot seed+init runs on the element's OWN pass: the container pass for a
  // list (per the contract, `each` state may be initialized by a seed on the
  // list element itself), the normal pass otherwise. Never per item — that
  // would run an element's seed once per row.
  const seedEnabled = !asListItem && (isListContainer || willRender);

  // The container pass skips subscribing (ListEntryRenderer owns the list's
  // deps); an item pass subscribes to props + hidden only — the container
  // already re-renders every row when `each` changes.
  useReactiveDeps(element, scopes, isListContainer ? "skip" : asListItem ? "render" : "all");
  const { pending, error: seedError } = useSeed({
    element,
    scopes,
    init,
    evaluator,
    enabled: seedEnabled,
  });

  // Props and `hidden` evaluate every pass. A fault is thrown below, inside
  // this element's own boundary, so the hook order never changes.
  let props: unknown = null;
  let hidden: unknown = false;
  let loading: unknown = false;
  let fault: unknown = null;
  if (element && impl && !isListContainer) {
    try {
      ({ props, hidden, loading } = impl.evaluate(element, scopes, evaluator, urlPolicy));
    } catch (err) {
      fault = err;
    }
  }
  // Same data → same object, so a state change that left this element's
  // props untouched does not reach `Render`.
  const prevProps = useRef(props);
  if (structurallyEqual(prevProps.current, props)) props = prevProps.current;
  else prevProps.current = props;

  // Pending debounced runs outlive a handler rebuild, not the element.
  const debouncers = useRef<Debouncers>(new Map());
  useEffect(() => {
    const pending = debouncers.current;
    return () => {
      for (const run of pending.values()) run.cancel();
    };
  }, []);
  const callbacks = useMemo(
    () =>
      element && impl && !isListContainer
        ? impl.callbacks(element, scopes, confirm, evaluator, onError, debouncers.current)
        : NO_CALLBACKS,
    [element, impl, isListContainer, scopes, confirm, evaluator, onError],
  );

  const isLoading = Boolean(loading);
  const context = useMemo(
    () => (element ? { entry: element, loading: isLoading, scopes } : null),
    [element, isLoading, scopes],
  );

  const Fallback = fallback ?? fallbackComponents?.placeholder ?? NullPlaceholder;
  const Placeholder =
    impl?.placeholder ?? fallbackComponents?.placeholder ?? NullPlaceholder;

  // Stable across this node's own re-renders, so the impl's props memo holds.
  const childKeys = element?.children;
  const children = useMemo(
    () =>
      childKeys?.length
        ? childKeys.map((childKey) => (
            <EntryRenderer
              key={childKey}
              elementKey={childKey}
              scopes={scopes}
              fallback={Placeholder}
              ancestors={lineage}
            />
          ))
        : null,
    [childKeys, scopes, Placeholder, lineage],
  );

  // Not streamed yet — show the placeholder. The slot stays mounted; `useElement`
  // wakes it when the entry arrives.
  if (!element) {
    return <Fallback reason="streaming" />;
  }

  // A bad `set` address is rejected off the entry's static strings at first
  // render, so the fault surfaces while the model is still streaming — not
  // when a customer first fires the callback.
  const invalidSet = findEntrySetAddressFault(element);
  if (invalidSet) {
    return (
      <ErrorBoundary
        errorComponent={fallbackComponents?.error}
        elementKey={elementKey}
        resetToken={element}
        onError={onError}
      >
        <ThrowError
          error={setAddressError(invalidSet.set, invalidSet.fault, elementKey)}
        />
      </ErrorBoundary>
    );
  }

  if (isListContainer) {
    // ListEntryRenderer evaluates `each` in its own render — boundary here so a
    // bad list expression latches the list slot, not the parent's subtree. An
    // async seed on the list element gates the iteration behind Suspense, so
    // `each` first evaluates against seeded state.
    return (
      <ErrorBoundary
        errorComponent={fallbackComponents?.error}
        elementKey={elementKey}
        resetToken={pending ?? element}
        onError={onError}
      >
        {seedError ? (
          <ThrowError error={seedError} />
        ) : pending ? (
          <Suspense fallback={<Fallback reason="seeding" />}>
            <SuspendUntil promise={pending}>
              <ListEntryRenderer elementKey={elementKey} scopes={scopes} ancestors={ancestors} />
            </SuspendUntil>
          </Suspense>
        ) : (
          <ListEntryRenderer elementKey={elementKey} scopes={scopes} ancestors={ancestors} />
        )}
      </ErrorBoundary>
    );
  }

  if (!impl) {
    // An unknown component name is a document fault, routed through the same
    // boundary as any other failure: it reaches the error slot and onError,
    // and a re-emission with a real component name (fresh entry identity →
    // reset token) recovers it like any corrected element.
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

  const { Render } = impl;
  const rendered = (slot: ReactNode) => {
    const result = (
      <Render
        {...(props as object)}
        {...callbacks}
        {...(slot ? { children: slot } : {})}
        __context={context ?? { entry: element, loading: isLoading, scopes }}
      />
    );
    return element.hidden ? <Activity mode={hidden ? "hidden" : "visible"}>{result}</Activity> : result;
  };
  const content = fault !== null ? <ThrowError error={fault} /> : rendered(children);

  // Props already passed the def's schema, so a throw from `Render` is the implementation's.
  return (
    <ErrorBoundary
      errorComponent={fallbackComponents?.error}
      elementKey={elementKey}
      // While an async seed is in flight the token is the batch promise: if the
      // fallback throws against pre-seed state, the latch clears when the seed
      // settles (the ref nulls → token flips back to the entry object).
      resetToken={pending ?? element}
      onError={onError}
      reason="implementation"
    >
      {seedError ? (
        <ThrowError error={seedError} />
      ) : pending ? (
        <Suspense fallback={fault !== null ? <ThrowError error={fault} /> : rendered(<Placeholder reason="seeding" />)}>
          <SuspendUntil promise={pending}>{content}</SuspendUntil>
        </Suspense>
      ) : (
        content
      )}
    </ErrorBoundary>
  );
};

export const EntryRenderer = memo(EntryRendererInner);

const ListEntryRendererInner = ({
  elementKey,
  scopes,
  ancestors,
}: {
  elementKey: string;
  scopes: Scopes;
  ancestors?: ReadonlySet<string>;
}): React.ReactElement | null => {
  const element = useElement(elementKey);
  const { evaluator } = useRendererRegistry();
  useReactiveDeps(element, scopes, "each");

  const list = element && isComponentListEntry(element) ? element : null;
  const rawItems = list ? evaluate({ expr: list.each }, { scopes }, evaluator) : [];
  if (rawItems instanceof Promise) {
    rawItems.catch(() => {});
    // The contract bans host functions (and `await`) in reactive sites; a
    // Promise here would otherwise fail as a vague "not an array".
    throw new EntryError(
      `"each" of ${elementKey} evaluated to a Promise — host functions and await are not allowed in props/hidden/loading/each; move the call to seed or a callback step`,
      { reason: "guardrail-violation", elementKey },
    );
  }
  if (list && rawItems != null && !Array.isArray(rawItems)) {
    // Contract violation: `each` must yield an array. Throwing here lands in
    // the list slot's own boundary (this component renders inside it).
    throw new EntryError(
      `List "each" must evaluate to an array, got ${typeof rawItems}: ${list.each}`,
      { reason: "invalid-list", elementKey },
    );
  }
  const items = (rawItems as unknown[] | null | undefined) ?? [];
  const rows = useItemScopes(scopes, list, items);

  if (!element) return null;

  if (!list) {
    // A key that mounted as a list became a non-list element — throw into the
    // list slot's boundary, same route as any other failure.
    throw new EntryError(`Element is not a list: ${elementKey}`, {
      reason: "invalid-list",
      elementKey,
    });
  }

  return (
    <>
      {rows.map(({ itemId, itemScopes }) => (
        <EntryRenderer
          key={`${elementKey}-item-${itemId}`}
          elementKey={elementKey}
          scopes={itemScopes}
          asListItem
          ancestors={ancestors}
        />
      ))}
    </>
  );
};

export const ListEntryRenderer = memo(ListEntryRendererInner);

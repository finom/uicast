"use client";
import React, { memo, Suspense, use, useEffect, type ReactNode } from "react";
import { EntryError, isComponentListEntry, evaluate } from "@uicast/core";
import { useRendererRegistry } from "../store/renderer-registry";
import { ErrorBoundary } from "../providers/error-boundary";
import { useElement } from "../store/elements-store";
import type { InitFn, Scopes } from "../types";
import { useReactiveDeps } from "./use-reactive-deps";
import { useSeedDefaults } from "./use-seed-defaults";
import { useItemScopes } from "./use-item-scopes";

type PlaceholderComponent = () => React.ReactElement | null;

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
function ThrowError({ error }: { error: Error }): never {
  throw error;
}

type EntryRendererProps = {
  elementKey: string;
  scopes: Scopes;
  // Set only on the synthetic RootFragment mount, so `init` fires once and
  // descendants never re-fire it.
  init?: InitFn;
  // Shown while this node's entry hasn't streamed in; the parent passes its own
  // placeholder so the slot looks unchanged.
  fallback?: PlaceholderComponent;
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
}: EntryRendererProps): React.ReactElement => {
  // This node's element only — re-renders when this key changes, not a sibling.
  const element = useElement(elementKey);
  const { implementations, fallbackComponents, functions, allowGlobals, onError } =
    useRendererRegistry();

  // A list entry reached as a child slot iterates its items; reached per-item
  // (`asListItem`) it renders as a normal component in the item scope.
  const isListContainer = !!element && isComponentListEntry(element) && !asListItem;

  const implEntry = element ? implementations[element.component] : undefined;
  const Component = implEntry?.render;
  // Whether this pass renders the real component (vs. placeholder / list / unknown).
  const willRender = !!element && !isListContainer && !!Component;
  // One-shot seed+init runs on the element's OWN pass: the container pass for a
  // list (per the contract, `each` state may be initialized by a seed on the
  // list element itself), the normal pass otherwise. Never per item — that
  // would run an element's seed once per row.
  const seedEnabled = !asListItem && (isListContainer || willRender);

  useReactiveDeps(element, scopes, isListContainer);
  const { pending, error: seedError } = useSeedDefaults({
    element,
    scopes,
    init,
    functions,
    allowGlobals,
    enabled: seedEnabled,
  });

  // Not streamed yet — show the placeholder. The slot stays mounted; `useElement`
  // wakes it when the entry arrives.
  if (!element) {
    const Fallback = fallback ?? fallbackComponents?.placeholder ?? NullPlaceholder;
    return <Fallback />;
  }

  if (isListContainer) {
    // ListEntryRenderer evaluates `each` in its own render — boundary here so a
    // bad list expression latches the list slot, not the parent's subtree. An
    // async seed on the list element gates the iteration behind Suspense, so
    // `each` first evaluates against seeded state.
    const ListFallback = fallback ?? fallbackComponents?.placeholder ?? NullPlaceholder;
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
          <Suspense fallback={<ListFallback />}>
            <SuspendUntil promise={pending}>
              <ListEntryRenderer elementKey={elementKey} scopes={scopes} />
            </SuspendUntil>
          </Suspense>
        ) : (
          <ListEntryRenderer elementKey={elementKey} scopes={scopes} />
        )}
      </ErrorBoundary>
    );
  }

  if (!Component) {
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

  const Placeholder =
    implEntry?.placeholder ?? fallbackComponents?.placeholder ?? NullPlaceholder;

  const children = element.children?.length
    ? element.children.map((childKey) => (
        <EntryRenderer
          key={childKey}
          elementKey={childKey}
          scopes={scopes}
          fallback={Placeholder}
        />
      ))
    : null;

  const content = (
    <Component entry={element} scopes={scopes}>
      {children}
    </Component>
  );

  return (
    <ErrorBoundary
      errorComponent={fallbackComponents?.error}
      elementKey={elementKey}
      // While an async seed is in flight the token is the batch promise: if the
      // fallback throws against pre-seed state, the latch clears when the seed
      // settles (the ref nulls → token flips back to the entry object).
      resetToken={pending ?? element}
      onError={onError}
    >
      {seedError ? (
        <ThrowError error={seedError} />
      ) : pending ? (
        <Suspense
          fallback={
            <Component entry={element} scopes={scopes}>
              <Placeholder />
            </Component>
          }
        >
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
}: {
  elementKey: string;
  scopes: Scopes;
}): React.ReactElement | null => {
  const element = useElement(elementKey);
  const { functions, allowGlobals } = useRendererRegistry();
  useReactiveDeps(element, scopes);

  const list = element && isComponentListEntry(element) ? element : null;
  const rawItems = list
    ? evaluate({ expr: list.each }, { scopes }, { functions, allowGlobals })
    : [];
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

  // Expose the per-item proxies to the parent scope as `childScopes.<as>` so
  // list-level expressions can aggregate over items. Written post-commit: a
  // render-phase `$set` would dispatch subscribed components' reducers while
  // this component renders, which React forbids.
  const lastScope = scopes[Object.keys(scopes)[Object.keys(scopes).length - 1]];
  const itemScopeName = list?.as;
  useEffect(() => {
    if (!itemScopeName) return;
    // `$set` no longer invents a missing parent, so establish `childScopes`
    // before writing into it. Two writes on the first render only; keeping the
    // per-`as` path means a reader of `childScopes.<as>` is woken precisely.
    lastScope.$set("childScopes", {}, { default: true });
    lastScope.$set(
      `childScopes.${itemScopeName}`,
      rows.map((row) => row.itemProxy),
    );
  }, [lastScope, itemScopeName, rows]);

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
        />
      ))}
    </>
  );
};

export const ListEntryRenderer = memo(ListEntryRendererInner);

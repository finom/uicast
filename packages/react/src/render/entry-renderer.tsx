"use client";
import React, { memo, Suspense, use, useEffect, useRef, type ReactNode } from "react";
import { EntryError, isComponentListEntry } from "@uicast/core";
import {
  evaluate,
  findNumericSetPath,
  numericSetPathError,
} from "@uicast/core/internal";
import { useRendererRegistry } from "../store/renderer-registry";
import { ErrorBoundary } from "../providers/error-boundary";
import { useElement } from "../store/elements-store";
import type { InitFn, PlaceholderComponentProps, Scopes } from "../types";
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

  // The container pass skips subscribing (ListEntryRenderer owns the list's
  // deps); an item pass subscribes to props + hidden only — the container
  // already re-renders every row when `each` changes.
  useReactiveDeps(element, scopes, isListContainer ? "skip" : asListItem ? "render" : "all");
  const { pending, error: seedError } = useSeed({
    element,
    scopes,
    init,
    functions,
    allowGlobals,
    enabled: seedEnabled,
  });

  const Fallback = fallback ?? fallbackComponents?.placeholder ?? NullPlaceholder;

  // Not streamed yet — show the placeholder. The slot stays mounted; `useElement`
  // wakes it when the entry arrives.
  if (!element) {
    return <Fallback reason="streaming" />;
  }

  // Numeric-key `set` paths are rejected off the entry's static strings at
  // first render, so the fault surfaces while the model is still streaming —
  // not when a customer first fires the callback (the only steps `useSeed`
  // wouldn't catch anyway).
  const invalidSet = findNumericSetPath(element);
  if (invalidSet) {
    return (
      <ErrorBoundary
        errorComponent={fallbackComponents?.error}
        elementKey={elementKey}
        resetToken={element}
        onError={onError}
      >
        <ThrowError
          error={numericSetPathError(invalidSet.set, invalidSet.segment, elementKey)}
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
              <Placeholder reason="seeding" />
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
  useReactiveDeps(element, scopes, "each");

  const list = element && isComponentListEntry(element) ? element : null;
  const rawItems = list
    ? evaluate({ expr: list.each }, { scopes }, { functions, allowGlobals })
    : [];
  if (rawItems instanceof Promise) {
    // The contract bans host functions (and `await`) in reactive sites; a
    // Promise here would otherwise fail as a vague "not an array".
    throw new EntryError(
      `"each" of ${elementKey} evaluated to a Promise — host functions and await are not allowed in props/hidden/each; move the call to seed or a callback step`,
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

  // Publish the per-item proxies as `childScopes.<as>` on the containing
  // scope. Post-commit only: a render-phase `$set` would dispatch subscribers
  // mid-render, which React forbids. Scopes are appended parents-first and
  // `as` names are contract-unique, so the LAST key is the innermost scope —
  // the one this list lives in.
  const innermostScope = scopes[Object.keys(scopes)[Object.keys(scopes).length - 1]];
  const itemScopeName = list?.as;
  // The effect re-runs on every list commit (`rows` is fresh each render);
  // skip republishing only when every row's `itemScopes` reference survived.
  // useItemScopes rebuilds those exactly when item value or index changed, so
  // a same-id refetch still republishes (the emit is the only wake childScopes
  // readers get) while a true no-op commit stays silent.
  const publishedRef = useRef<{
    scope: (typeof scopes)[string];
    name: string;
    rowScopes: Scopes[];
  } | null>(null);
  useEffect(() => {
    if (!itemScopeName) return;
    const rowScopes = rows.map((row) => row.itemScopes);
    const prev = publishedRef.current;
    if (
      prev &&
      prev.scope === innermostScope &&
      prev.name === itemScopeName &&
      prev.rowScopes.length === rowScopes.length &&
      rowScopes.every((rowScope, i) => rowScope === prev.rowScopes[i])
    ) {
      return;
    }
    publishedRef.current = { scope: innermostScope, name: itemScopeName, rowScopes };
    // `$set` throws on a missing parent, so establish `childScopes` before
    // writing into it. Keeping the per-`as` path means a reader of
    // `childScopes.<as>` is woken precisely.
    innermostScope.$set("childScopes", {}, { default: true });
    innermostScope.$set(
      `childScopes.${itemScopeName}`,
      rows.map((row) => row.itemProxy),
    );
  }, [innermostScope, itemScopeName, rows]);

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

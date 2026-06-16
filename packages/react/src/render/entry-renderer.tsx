"use client";
import React, { memo, Suspense, use, type ReactNode } from "react";
import { isComponentListEntry, evaluate } from "@ui-fired/core";
import { useRendererRegistry } from "../store/renderer-registry";
import { DefaultErrorComponent, ErrorBoundary } from "../providers/error-boundary";
import { useElement } from "../store/elements-store";
import type { InitFn, Scopes, UnknownComponentProps } from "../types";
import { useReactiveDeps } from "./use-reactive-deps";
import { useSeedDefaults } from "./use-seed-defaults";
import { useItemScopes } from "./use-item-scopes";

type PlaceholderComponent = () => React.ReactElement | null;

// Stable no-op placeholder. Hoisted so the `fallback` prop passed to child
// slots keeps a constant identity (a fresh `() => null` each render would
// defeat the `React.memo` bail below).
const NullPlaceholder: PlaceholderComponent = () => null;

// Zero-dependency default for the `systemVisuals.unknown` slot — like the error
// default, a bare inline-styled div (the shadcn-styled version ships in
// @ui-fired/catalog as `UnknownComponent`).
const DefaultUnknown = ({ componentName, elementKey }: UnknownComponentProps) => (
  <div style={{ color: "yellow" }} data-key={elementKey}>
    Unknown component: {componentName}
  </div>
);

// Gate a subtree on an async-defaults Promise: throws it to the nearest
// <Suspense> until it resolves, then renders `children`.
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

type EntryRendererProps = {
  elementKey: string;
  scopes: Scopes;
  // One-shot side-effect callback. Set ONLY for the top-level mount of the
  // synthetic RootFragment wrapper that `<Renderer>` builds; recursive child
  // mounts below omit it so descendants never re-fire `init`. Threaded into
  // `useSeedDefaults`, which shares the defaults' async/Suspense pipeline.
  init?: InitFn;
  // Placeholder shown while THIS node's entry hasn't streamed in yet. Supplied
  // by the parent (its per-component placeholder, else the registry default) so
  // an unstreamed child slot looks the same as when the parent owned the
  // decision. A stable reference, so it doesn't break memoization.
  fallback?: PlaceholderComponent;
  // True only when `ListEntryRenderer` renders this element once per item: render it
  // as a normal component in the item scope rather than re-dispatching it back
  // to `ListEntryRenderer` (which would recurse forever).
  asListItem?: boolean;
};

const EntryRendererInner = ({
  elementKey,
  scopes,
  init,
  fallback,
  asListItem = false,
}: EntryRendererProps): React.ReactElement => {
  // Subscribe to THIS node's element only — re-renders when this key's entry
  // streams in / changes, never because a sibling did.
  const element = useElement(elementKey);
  const { implementations, systemVisuals, functions } = useRendererRegistry();

  // A list entry reached as a child slot renders as a LIST (iterate items); the
  // same entry reached per-item (`asListItem`) renders as a normal component in
  // the item scope.
  const isListContainer = !!element && isComponentListEntry(element) && !asListItem;

  const implEntry = element ? implementations[element.component] : undefined;
  const Component = implEntry?.render;
  // Will this pass render the real component (vs. a placeholder / list hand-off
  // / unknown slot below)? Gates the one-shot defaults+init seeding.
  const willRender = !!element && !isListContainer && !!Component;

  useReactiveDeps(element, scopes, isListContainer);
  const pending = useSeedDefaults({ element, scopes, init, functions, enabled: willRender });

  // Not streamed yet — show the parent placeholder (or registry default). The
  // slot stays mounted; when its entry arrives `useElement` wakes it.
  if (!element) {
    const Fallback = fallback ?? systemVisuals?.placeholder ?? NullPlaceholder;
    return <Fallback />;
  }

  // List container → hand off to ListEntryRenderer.
  if (isListContainer) {
    return <ListEntryRenderer elementKey={elementKey} scopes={scopes} />;
  }

  // No implementation for this component name → the unknown slot.
  if (!Component) {
    const Unknown = systemVisuals?.unknown ?? DefaultUnknown;
    return <Unknown componentName={element.component} elementKey={elementKey} />;
  }

  const Placeholder =
    implEntry?.placeholder ?? systemVisuals?.placeholder ?? NullPlaceholder;

  // `element.children?.length` — Prisma rehydrates an unset `children` column as
  // `[]`, and a truthy `[]` would leak past a plain `?` guard and clobber any
  // `children` supplied through `entry.props` (createComponentImplementation
  // spreads it second). Collapse to `null` for leaf entries so props-supplied
  // children survive.
  //
  // Each child renders unconditionally as its own slot — it decides for itself
  // whether it's pending, a list, or a normal entry by reading its own element.
  // That's why streaming a child in doesn't re-render this parent.
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

  // One ErrorBoundary wraps both paths; async defaults additionally gate the
  // real content behind <Suspense> (the fallback is the same component shell
  // showing its Placeholder).
  return (
    <ErrorBoundary errorComponent={systemVisuals?.error} elementKey={elementKey}>
      {pending ? (
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

// Plain shallow memo. Props are stabilised by callers (`scopes` via useMemo,
// `fallback`/`init`/`asListItem` stable), so a node re-renders only on its own
// `useElement` subscription or its own reactive `forceRender` — never an
// unrelated parent re-render. This is what makes a settled subtree render
// exactly once while siblings stream in.
export const EntryRenderer = memo(EntryRendererInner);

const ListEntryRendererInner = ({
  elementKey,
  scopes,
}: {
  elementKey: string;
  scopes: Scopes;
}): React.ReactElement => {
  const element = useElement(elementKey);
  const { functions, systemVisuals } = useRendererRegistry();
  // Auto-subscribe to the list entry's own deps (`each` + any props/hidden).
  useReactiveDeps(element, scopes);

  // Resolve the list source + every item's cached scope up front, so the body
  // below stays flat: guard → expose childScopes → render.
  const list = element && isComponentListEntry(element) ? element : null;
  const items = list
    ? ((evaluate({ expr: list.each }, { scopes }, { functions }) as unknown[]) ?? [])
    : [];
  const rows = useItemScopes(scopes, list, items);

  if (!element) return <></>;

  if (!list) {
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

  // Expose the per-item proxies to the parent scope as `childScopes.<as>` so
  // list-level expressions can aggregate over items.
  const lastScope = scopes[Object.keys(scopes)[Object.keys(scopes).length - 1]];
  lastScope.$set(
    `childScopes.${list.as}`,
    rows.map((row) => row.itemProxy),
  );

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

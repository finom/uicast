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

const NullPlaceholder: PlaceholderComponent = () => null;

// Default for the `unknown` slot: a bare inline-styled div (shadcn version in
// @ui-fired/catalog as `UnknownComponent`).
const DefaultUnknown = ({ componentName, elementKey }: UnknownComponentProps) => (
  <div style={{ color: "yellow" }} data-key={elementKey}>
    Unknown component: {componentName}
  </div>
);

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
  const { implementations, overrides, functions } = useRendererRegistry();

  // A list entry reached as a child slot iterates its items; reached per-item
  // (`asListItem`) it renders as a normal component in the item scope.
  const isListContainer = !!element && isComponentListEntry(element) && !asListItem;

  const implEntry = element ? implementations[element.component] : undefined;
  const Component = implEntry?.render;
  // Whether this pass renders the real component (vs. placeholder / list / unknown).
  // Gates the one-shot defaults+init seeding.
  const willRender = !!element && !isListContainer && !!Component;

  useReactiveDeps(element, scopes, isListContainer);
  const pending = useSeedDefaults({ element, scopes, init, functions, enabled: willRender });

  // Not streamed yet — show the placeholder. The slot stays mounted; `useElement`
  // wakes it when the entry arrives.
  if (!element) {
    const Fallback = fallback ?? overrides?.placeholder ?? NullPlaceholder;
    return <Fallback />;
  }

  if (isListContainer) {
    return <ListEntryRenderer elementKey={elementKey} scopes={scopes} />;
  }

  if (!Component) {
    const Unknown = overrides?.unknown ?? DefaultUnknown;
    return <Unknown componentName={element.component} elementKey={elementKey} />;
  }

  const Placeholder =
    implEntry?.placeholder ?? overrides?.placeholder ?? NullPlaceholder;

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
    <ErrorBoundary errorComponent={overrides?.error} elementKey={elementKey}>
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

export const EntryRenderer = memo(EntryRendererInner);

const ListEntryRendererInner = ({
  elementKey,
  scopes,
}: {
  elementKey: string;
  scopes: Scopes;
}): React.ReactElement => {
  const element = useElement(elementKey);
  const { functions, overrides } = useRendererRegistry();
  useReactiveDeps(element, scopes);

  const list = element && isComponentListEntry(element) ? element : null;
  const items = list
    ? ((evaluate({ expr: list.each }, { scopes }, { functions }) as unknown[]) ?? [])
    : [];
  const rows = useItemScopes(scopes, list, items);

  if (!element) return <></>;

  if (!list) {
    // A key that mounted as a list became a non-list element — surface it
    // through the same `error` slot as a render throw.
    const ErrorComponent = overrides?.error ?? DefaultErrorComponent;
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

import { buildElementsByKey, type ComponentEntry } from "@uicast/core";
import { Fragment, type ReactElement, type ReactNode, useMemo } from "react";
import { engineOf } from "../impl/engine";
import { createElementsStore, ElementsStoreProvider, slotId, useElement, useSlot } from "../providers/elements-store";
import { useRendererRegistry } from "../providers/renderer-provider";

// A list has no length yet; a few rows read as a list.
const LIST_ROWS = 3;
const MAX_DEPTH = 12;
const NO_ANCESTORS: ReadonlySet<string> = new Set();

// A malformed line (a string `children`) draws no children instead of failing the skeleton.
const childKeys = (entry: ComponentEntry): string[] => (Array.isArray(entry.children) ? entry.children : []);

// The keys no line names as a child, in first-emitted order.
export const rootKeys = (entries: ComponentEntry[]): string[] => {
  const referenced = new Set(entries.flatMap(childKeys));
  return [...new Set(entries.map((entry) => entry.key))].filter((key) => !referenced.has(key));
};

// An element and everything under it, from the entries alone. Each node wakes when its own entry streams in.
// `hidden` is not evaluated, so an element that has it is left out, unless the caller evaluated it (`visible`).
export function SubtreeSkeleton({
  elementKey,
  ancestors = NO_ANCESTORS,
  visible = false,
  slot,
  inList = false,
}: {
  elementKey: string;
  ancestors?: ReadonlySet<string>;
  visible?: boolean;
  // The parent's `children` slot; a key listed in another slot first draws only there.
  slot?: string;
  // Inside a list's rows, so a nested list draws one row, not a few per outer row.
  inList?: boolean;
}): ReactNode {
  const entry = useElement(elementKey);
  const renderedIn = useSlot(elementKey);
  const { implementations, fallbackComponents, urlPolicy } = useRendererRegistry();
  if (!entry || (entry.hidden !== undefined && !visible)) return null;
  if (ancestors.size > MAX_DEPTH || ancestors.has(elementKey)) return null;
  if (slot !== undefined && slot !== renderedIn) return null;

  const lineage = new Set(ancestors).add(elementKey);
  const keys = childKeys(entry);
  const rowsInside = inList || !!entry.each;
  const children = keys.map((key, index) => (
    <SubtreeSkeleton
      key={keys.indexOf(key) === index ? key : `${key}#${index}`}
      elementKey={key}
      ancestors={lineage}
      slot={slotId(elementKey, index)}
      inList={rowsInside}
    />
  ));

  const impl = implementations[entry.component];
  const knownProps = impl ? engineOf(impl).knownProps(entry, urlPolicy) : undefined;
  const Skeleton = impl?.skeleton;
  const Fallback = fallbackComponents?.defaultSkeleton;
  let self: ReactNode;
  // Always pass `children`: it is what tells a skeleton to draw its own tag.
  if (Skeleton) {
    self = (
      <Skeleton reason="seeding" entry={entry} knownProps={knownProps}>
        {keys.length ? children : null}
      </Skeleton>
    );
  }
  // No tag of its own, so the children stand in for it, unwrapped like a list below.
  else if (keys.length) self = children;
  else self = Fallback ? <Fallback reason="seeding" entry={entry} knownProps={knownProps} /> : null;

  if (!entry.each || inList) return self;
  // Wrapping it would put a div where the parent expects its own child (a row inside a table).
  return (
    <>
      {Array.from({ length: LIST_ROWS }, (_, row) => (
        <Fragment key={row}>{self}</Fragment>
      ))}
    </>
  );
}

/**
 * Draws the document's shape from the entries alone, with the skeletons of the nearest `<RendererProvider>`. It
 * evaluates nothing, so it renders in a server pass.
 *
 * @example
 * return mounted ? <EntriesRenderer entries={entries} /> : <DocumentSkeleton entries={entries} />;
 *
 * @example
 * <Suspense fallback={<DocumentSkeleton entries={entries} />}>
 *   <EntriesRenderer entries={entries} />
 * </Suspense>
 */
export function DocumentSkeleton({ entries }: { entries: ComponentEntry[] }): ReactElement | null {
  const store = useMemo(() => createElementsStore(buildElementsByKey(entries)), [entries]);
  const roots = useMemo(() => rootKeys(entries), [entries]);
  if (entries.length === 0) return null;

  return (
    <ElementsStoreProvider value={store}>
      <div aria-busy aria-hidden>
        {roots.map((key) => (
          <SubtreeSkeleton key={key} elementKey={key} />
        ))}
      </div>
    </ElementsStoreProvider>
  );
}

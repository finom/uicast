import type { ComponentEntry } from "@uicast/core";
import type { ComponentImplementation } from "@uicast/react";
import { Fragment, type ReactElement } from "react";
import { Skeleton } from "../components/ui/skeleton";

// Nothing is evaluated, so this renders wherever the entries are, a server pass included.

// A list has no length yet; a few rows read as a list.
const LIST_ROWS = 3;
const MAX_DEPTH = 12;

function Node({
  entry,
  byKey,
  byName,
  seen,
  depth,
}: {
  entry: ComponentEntry;
  byKey: Map<string, ComponentEntry>;
  byName: Map<string, ComponentImplementation>;
  seen: Set<string>;
  depth: number;
}): ReactElement | null {
  if (depth > MAX_DEPTH || seen.has(entry.key)) return null;
  const nextSeen = new Set(seen).add(entry.key);

  const childEntries = (entry.children ?? [])
    .map((key) => byKey.get(key))
    .filter((child): child is ComponentEntry => child !== undefined);
  const children = childEntries.map((child) => (
    <Node key={child.key} entry={child} byKey={byKey} byName={byName} seen={nextSeen} depth={depth + 1} />
  ));

  // Always pass `children`: it is what tells a placeholder to draw its own tag.
  const placeholder = byName.get(entry.component)?.placeholder;
  let self: ReactElement;
  if (placeholder) self = placeholder({ reason: "seeding", children: childEntries.length ? children : null });
  else if (childEntries.length) self = <div className="flex flex-col gap-2">{children}</div>;
  else self = <Skeleton className="h-4 w-24" />;

  if (!entry.each) return self;
  // Wrapping it would put a div where the parent expects its own child (a row inside a table).
  return (
    <>
      {Array.from({ length: LIST_ROWS }, (_, row) => (
        <Fragment key={row}>{self}</Fragment>
      ))}
    </>
  );
}

// Throwaway markup: the real tree replaces it, so nothing has to match.
export function DocumentSkeleton({
  entries,
  implementations,
}: {
  entries: ComponentEntry[];
  implementations: ComponentImplementation[];
}): ReactElement | null {
  if (entries.length === 0) return null;
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const byName = new Map(implementations.map((impl) => [impl.def.name, impl]));
  const referenced = new Set(entries.flatMap((entry) => entry.children ?? []));
  const roots = entries.filter((entry) => !referenced.has(entry.key));

  return (
    <div aria-busy aria-hidden>
      {roots.map((root) => (
        <Node key={root.key} entry={root} byKey={byKey} byName={byName} seen={new Set()} depth={0} />
      ))}
    </div>
  );
}

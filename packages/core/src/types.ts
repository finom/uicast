import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";

// A bare JavaScript expression string, always evaluated as code (no literal
// form). Used by `hidden` and `each`.
export type Expression = string;

// A dotted path into the reactive `scopes` store — the write target of an
// assignment, e.g. `"scopes.root.users"`. Logically just a string; the alias
// documents intent (mirrors `Expression`). Used by the `set` field below.
export type ScopePath = string;

// A value: `literal` is any JSON value used as-is (no evaluation); `expr` is
// evaluated as code.
export type ValueSource = { expr: Expression } | { literal: unknown };
export type ValueSourceAssignment = { set: ScopePath } & ValueSource;
export type ConfirmableValueSourceAssignment = {
  confirm?: string;
} & ValueSourceAssignment;

/**
 * The ui-fired entry model. One line of a ui-fired document is a
 * `ComponentEntry`. A `ComponentListEntry` is an entry that repeats: it carries
 * `each` (the array to iterate) plus `as` and an optional `keyBy`.
 *
 * There is no separate "plain entry" type and no
 * `ComponentEntry | ComponentListEntry` union: the list fields (`each`, `as`,
 * `keyBy`) live on `ComponentEntry` as optional, so one type describes every
 * line and a heterogeneous `ComponentEntry[]` can hold list lines directly.
 * `ComponentListEntry` is the same shape with `each`/`as` required — narrow
 * `ComponentEntry` → `ComponentListEntry` with `isComponentListEntry` (presence
 * of `each`).
 */
export interface ComponentEntry {
  key: string;
  component: string;
  props?: ValueSource;
  defaults?: ValueSourceAssignment[];
  hidden?: Expression;
  callbacks?: Record<string, ConfirmableValueSourceAssignment[]>;
  children?: string[];
  // List fields — present only when the entry repeats (`each` is the marker).
  // Optional here so a heterogeneous `ComponentEntry[]` can hold list lines
  // directly; `ComponentListEntry` below is the same shape with `each`/`as`
  // required.
  each?: Expression;
  as?: string;
  keyBy?: (string & {}) | "_index" | "_item";
}

/**
 * A list entry repeats — the same shape as `ComponentEntry` with the iteration
 * fields required. `each` is the structural marker (its presence is what makes
 * an entry a list); `as` names the per-item scope.
 */
export interface ComponentListEntry extends ComponentEntry {
  each: Expression;
  as: string;
}

/**
 * Narrow a `ComponentEntry` to a `ComponentListEntry`. List-ness is the
 * presence of `each` — there is no `kind` discriminator, exactly like root-ness
 * (derived from an entry being referenced by no other entry's `children`).
 */
export function isComponentListEntry(
  entry: ComponentEntry,
): entry is ComponentListEntry {
  return entry.each !== undefined;
}

/**
 * An interface that combines StandardJSONSchema and StandardSchema.
 * */
export type CombinedSpec<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output> &
  StandardJSONSchemaV1<Input, Output>;

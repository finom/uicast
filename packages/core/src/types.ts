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
// Callback steps may omit `set` — a step can run purely for its side effect
// (a mutation call), with nothing written to scope.
export type ConfirmableValueSourceAssignment = {
  confirm?: string;
  set?: ScopePath;
} & ValueSource;

/** One document line. List fields (`each`/`as`/`keyBy`) are optionals — no union, so `ComponentEntry[]` holds list lines; narrow via `isComponentListEntry`. */
export interface ComponentEntry {
  key: string;
  component: string;
  props?: ValueSource;
  seed?: ValueSourceAssignment[];
  hidden?: Expression;
  callbacks?: Record<string, ConfirmableValueSourceAssignment[]>;
  children?: string[];
  // List fields — see the doc above; `ComponentListEntry` requires them.
  each?: Expression;
  as?: string;
  // Item field carrying the stable per-item identity; absent (or missing on
  // an item) → the index.
  keyBy?: string;
}

/** A `ComponentEntry` whose iteration fields are required; `as` names the per-item scope. */
export interface ComponentListEntry extends ComponentEntry {
  each: Expression;
  as: string;
}

/** List-ness is the presence of `each` — no `kind` discriminator. */
export function isComponentListEntry(
  entry: ComponentEntry,
): entry is ComponentListEntry {
  return entry.each !== undefined;
}

/**
 * Narrow an untrusted parsed value to a `ComponentEntry` — the shape guard for
 * model-emitted lines (`streamJsonLines` output, fence bodies, stored JSONL).
 */
export function isComponentEntry(value: unknown): value is ComponentEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as ComponentEntry;
  return (
    typeof entry.key === "string" &&
    typeof entry.component === "string" &&
    // The least-trusted input path: `children` as a string (a plausible LLM
    // slip) would be iterated char-by-char downstream into phantom child slots.
    (entry.children === undefined || Array.isArray(entry.children))
  );
}

/** A schema usable both ways: runtime validation (Standard Schema) plus JSON Schema serialization for the prompt. */
export type CombinedSpec<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output> &
  StandardJSONSchemaV1<Input, Output>;

/**
 * What the LLM reads for a component: a props spec plus callback specs.
 * Parameterized so `createComponentImplementation` infers exact types off the
 * def; the bare `ComponentDefinition` default is the widened collection form.
 */
export type ComponentDefinition<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  name: string;
  description: string;
  props: TProps;
  callbacks?: TCallbacks;
  /** Host-only component: registered for rendering, excluded from the prompt (e.g. RootFragment). */
  hidden?: boolean;
};

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
 * `Fired` — the ui-fired element model. One line of a ui-fired document is a
 * `Fired.Element`. A `Fired.List` is an element that repeats: it
 * carries `each` (the array to iterate) plus `as` and an optional `keyBy`. The
 * brand lives on the namespace so the member names stay clean (the same shape
 * as React's `React.ReactNode` / `React.FC`), and the bare `Element` name can't
 * collide with the DOM global.
 *
 * There is no separate "plain element" type and no `Element | List` union: the
 * list fields (`each`, `as`, `keyBy`) live on `Element` as optional, so one
 * `Element` type describes every line and a heterogeneous `Element[]` can hold
 * list lines directly. `List` is the same shape with `each`/`as` required —
 * narrow `Element` → `List` with `Fired.isList` (presence of `each`).
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Fired {
  /**
   * One element — one line of the document. This is the authoring type for
   * every line, list or not. The list fields below are optional: a line *may*
   * repeat. When it does, it's a `List` (with `each`/`as` required); narrow to
   * that with `Fired.isList`.
   */
  export interface Element {
    key: string;
    component: string;
    props?: ValueSource;
    defaults?: ValueSourceAssignment[];
    hidden?: Expression;
    callbacks?: Record<string, ConfirmableValueSourceAssignment[]>;
    children?: string[];
    // List fields — present only when the element repeats (`each` is the
    // marker). Optional here so a heterogeneous `Element[]` can hold list lines
    // directly; `List` below is the same shape with `each`/`as` required.
    each?: Expression;
    as?: string;
    keyBy?: (string & {}) | "_index" | "_item";
  }

  /**
   * A list is an element that repeats — the same shape as `Element` with the
   * iteration fields required. `each` is the structural marker (its presence is
   * what makes an element a list); `as` names the per-item scope.
   */
  export interface List extends Element {
    each: Expression;
    as: string;
  }

  /**
   * Narrow an `Element` to a `List`. List-ness is the presence of `each` —
   * there is no `kind` discriminator, exactly like root-ness (derived from an
   * element being referenced by no other element's `children`).
   */
  export function isList(el: Element): el is List {
    return el.each !== undefined;
  }
}

// Core models only elements. Any streaming/metadata envelope around them is the
// consumer's concern, not core's.

export interface CombinedProps<Input = unknown, Output = Input>
  extends
    StandardSchemaV1.Props<Input, Output>,
    StandardJSONSchemaV1.Props<Input, Output> {}

/**
 * An interface that combines StandardJSONSchema and StandardSchema.
 * */
export interface CombinedSpec<Input = unknown, Output = Input> {
  "~standard": CombinedProps<Input, Output>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CombinedSpec {
  export type Target = StandardJSONSchemaV1.Target;
  export type InferInput<T extends StandardSchemaV1> =
    StandardSchemaV1.InferInput<T>;
  export type InferOutput<T extends StandardSchemaV1> =
    StandardSchemaV1.InferOutput<T>;
  export type SuccessResult<T> = StandardSchemaV1.SuccessResult<T>;
}

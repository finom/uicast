import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";

/**
 * The base shape every component chunk shares. A plain (non-list) chunk is
 * exactly this; a list chunk extends it with the iteration fields below. Put
 * any field common to all chunks (props, defaults, hidden, callbacks,
 * children, …) here so the two variants can't drift.
 */
export interface ChunkComponentElement {
  key: string;
  component: string;
  props?: ValueSource;
  defaults?: ValueSourceAssignment[];
  hidden?: Expression;
  callbacks?: Record<string, ConfirmableValueSourceAssignment[]>;
  children?: string[];
}

// A list chunk adds the iteration fields. `each` is the structural
// discriminator for the `ChunkComponent` union below.
export interface ChunkComponentList extends ChunkComponentElement {
  keyBy?: (string & {}) | "_index" | "_item";
  as: string;
  each: Expression;
}

// A chunk is a **list** iff it has an `each` field; otherwise it's a regular
// element. There is no `kind` discriminator — list-ness is derived structurally
// from the presence of `each`, exactly like root-ness is derived from a chunk
// being referenced by no other chunk's `children`. Narrow with `"each" in chunk`.
export type ChunkComponent = ChunkComponentElement | ChunkComponentList;

// Core models only component chunks. Any streaming/metadata envelope around
// them is the consumer's concern, not core's.

// A bare JavaScript expression string, always evaluated as code (no literal
// form). Used by `hidden` and `each`.
export type Expression = string;

// A value: `literal` is any JSON value used as-is (no evaluation); `expr` is
// evaluated as code.
export type ValueSource = { expr: Expression; } | { literal: unknown };
export type ValueSourceAssignment = { set: string } & ValueSource;
export type ConfirmableValueSourceAssignment = { confirm?: string } & ValueSourceAssignment;

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

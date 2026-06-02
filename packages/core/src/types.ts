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
  hidden?: ValueSource;
  callbacks?: Record<string, ConfirmableValueSourceAssignment[]>;
  children?: string[];
}

// A list chunk adds the iteration fields. `each` is the structural
// discriminator for the `ChunkComponent` union below.
export interface ChunkComponentList extends ChunkComponentElement {
  keyBy?: (string & {}) | "_index" | "_item";
  as: string;
  each: string;
}

// A chunk is a **list** iff it has an `each` field; otherwise it's a regular
// element. There is no `kind` discriminator — list-ness is derived structurally
// from the presence of `each`, exactly like root-ness is derived from a chunk
// being referenced by no other chunk's `children`. Narrow with `"each" in chunk`.
export type ChunkComponent = ChunkComponentElement | ChunkComponentList;

// NOTE: the out-of-band metadata envelope (`ChunkMeta`, kind: "meta") and the
// meta-inclusive `Chunk = ChunkComponent | ChunkMeta` union are NOT defined
// here. They're a streaming-protocol concern owned entirely by the consuming
// app (neat-report's `@neat/types`); core is catalog-/transport-agnostic and
// only knows about component chunks.

export type ValueSource = { expr: string; } | { literal: unknown };
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

// props: expr, literal
// each: string (scope reference like scopes.root.myItems)
// callbacks: set, expr, literal, async
// defaults: set, expr, literal, async

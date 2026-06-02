import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";

export type ChunkComponentElement = {
  key: string;
  component: string;
  op: "root" | "child";
  kind: "element";
  props?: ValueExpr;
  defaults?: AssignableExpr[];
  hidden?: ValueExpr;
  callbacks?: Record<string, AssignableWithConfirmExpr[]>;
  children?: string[];
};

export type ChunkComponentList = {
  key: string;
  component: string;
  op: "child";
  kind: "list";
  itemIdKey?: (string & {}) | "_index" | "_item";
  itemScope: string;
  itemsSource: string;
  props?: ValueExpr;
  defaults?: AssignableExpr[];
  hidden?: ValueExpr;
  callbacks?: Record<string, AssignableWithConfirmExpr[]>;
  children?: string[];
};

export type ChunkComponent = ChunkComponentElement | ChunkComponentList;

/**
 * Out-of-band metadata chunk emitted by streaming render endpoints before any
 * component chunks. Consumers (the renderer, persistence layer) must skip it.
 *
 * `pageId` is loose `string` here because `packages/core` is catalog-agnostic
 * and can't reach into a consumer's Prisma/Zod schemas. The producing service
 * and the consuming context brand it via their own `PageSchema.shape.id`.
 */
export type ChunkMeta = {
  kind: "meta";
  pageId: string;
};

/**
 * The full stream-chunk union. Use this on the wire / in iterators that may
 * carry meta. `ChunkComponent` stays the narrower type for anything that only
 * renders or persists components.
 */
export type Chunk = ChunkComponent | ChunkMeta;

export type ValueExpr = { expr?: string; literal?: unknown };
export type AssignableExpr = { set: string } & ValueExpr;
export type AssignableWithConfirmExpr = { confirm?: string } & AssignableExpr;

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
// itemsSource: string (scope reference like scopes.root.myItems)
// callbacks: set, expr, literal, async
// defaults: set, expr, literal, async

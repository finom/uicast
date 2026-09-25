import type { StandardJSONSchemaV1, StandardSchemaV1 } from "@uicast/expr";

type Expression = string;

// A `set` address: `scopes.<scope>.<field>`.
type ScopePath = string;

export type ValueSource = { expr: Expression } | { literal: unknown };
export type ValueSourceAssignment = { set: ScopePath } & ValueSource;
// `set` absent: the step runs for its effect only.
export type CallbackValueSourceAssignment = {
  set?: ScopePath;
  // Asks before this step; declined, this step and the rest are skipped.
  confirm?: string;
  // This step and the rest wait `CALLBACK_DEBOUNCE_MS` of quiet; only the latest call runs.
  debounce?: boolean;
} & ValueSource;

// List fields are optional, so `ComponentEntry[]` holds list lines too; narrow with `isComponentListEntry`.
export interface ComponentEntry {
  key: string;
  component: string;
  props?: ValueSource;
  seed?: ValueSourceAssignment[];
  hidden?: Expression;
  // Truthy renders the element as busy. Reactive like `hidden`.
  loading?: Expression;
  callbacks?: Record<string, CallbackValueSourceAssignment[]>;
  children?: string[];
  each?: Expression;
  as?: string;
  // Absent (or missing on an item): the index.
  keyBy?: string;
}

export interface ComponentListEntry extends ComponentEntry {
  each: Expression;
  as: string;
}

export function isComponentListEntry(entry: ComponentEntry): entry is ComponentListEntry {
  return entry.each !== undefined;
}

// What the element table needs: `key`, `component`, and a `children` array. The renderer checks the rest at mount.
export function isComponentEntry(value: unknown): value is ComponentEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as ComponentEntry;
  return (
    typeof entry.key === "string" &&
    typeof entry.component === "string" &&
    // A string `children` (a plausible LLM slip) would be iterated char by char downstream.
    (entry.children === undefined || Array.isArray(entry.children))
  );
}

// Runtime validation (Standard Schema) plus JSON Schema for the prompt.
export type CombinedSpec<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output> &
  StandardJSONSchemaV1<Input, Output>;

// What the LLM reads for a component.
export type ComponentDefinition<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  name: string;
  description: string;
  props: TProps;
  callbacks?: TCallbacks;
  // Registered for rendering, excluded from the prompt.
  hidden?: boolean;
};

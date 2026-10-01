import type { StandardJSONSchemaV1, StandardSchemaV1 } from "@uicast/expr";

type Expression = string;

// A `set` address: `scopes.<scope>.<field>`.
type ScopePath = string;

/**
 * One value: `literal` is used as is, `expr` is an expression evaluated against the scopes.
 *
 * @example
 * const props: ValueSource = { expr: "({ text: scopes.root.title })" };
 * const fixed: ValueSource = { literal: { variant: "outline" } };
 */
export type ValueSource = { expr: Expression } | { literal: unknown };

/**
 * A `seed` step: a value source and the field it writes.
 *
 * @example
 * const step: ValueSourceAssignment = { set: "scopes.root.users", expr: "getUsers()" };
 */
export type ValueSourceAssignment = {
  /** The field to write: `scopes.<scope>.<field>`, never deeper. */
  set: ScopePath;
} & ValueSource;

/**
 * A callback step: a value source, optionally written to a field, confirmed first or debounced.
 *
 * @example
 * const toggle: CallbackValueSourceAssignment = { set: "scopes.root.open", expr: "!currentValue" };
 * const remove: CallbackValueSourceAssignment = { confirm: "Delete it?", expr: "deleteRow({ id: scopes.row.id })" };
 */
export type CallbackValueSourceAssignment = {
  /** The field to write: `scopes.<scope>.<field>`. Absent: the step runs for its effect only. */
  set?: ScopePath;
  /** A question asked before this step, e.g. `"Delete this row?"`. Declined, this step and the rest are skipped. */
  confirm?: string;
  /** This step and the rest wait for 300 ms of quiet; only the latest call runs. */
  debounce?: boolean;
} & ValueSource;

/**
 * One line of a document: the JSON for one element. List fields are optional, so a `ComponentEntry[]` holds lists
 * too; `each` marks a list.
 *
 * @example
 * const entry: ComponentEntry = {
 *   key: "open-count", component: "Typography",
 *   props: { expr: "({ text: 'Open: ' + scopes.root.open })" },
 * };
 */
export interface ComponentEntry {
  /** Unique id. Parents name children by it; re-emitting it replaces the element and its subtree. */
  key: string;
  /** The component name, matched exactly against the catalog. */
  component: string;
  /** The props object, e.g. `{ expr: "({ text: scopes.root.title })" }`. Reactive. */
  props?: ValueSource;
  /** Steps that set up state once, at mount. Each writes its field only while it is still undefined. */
  seed?: ValueSourceAssignment[];
  /** An expression; truthy hides the element. Reactive. */
  hidden?: Expression;
  /** An expression; truthy renders the element as busy. Reactive, like `hidden`. */
  busy?: Expression;
  /** Steps per event, e.g. `{ onClick: [{ set: "scopes.root.open", expr: "!currentValue" }] }`. */
  callbacks?: Record<string, CallbackValueSourceAssignment[]>;
  /** Child keys, in render order. */
  children?: string[];
  /** An expression returning the array to repeat over; it makes the entry a list. */
  each?: Expression;
  /** Names each item's two scopes: `scopes.<as>` is the item, `scopes.$<as>` its row. */
  as?: string;
  /** The item field that gives the row its `id`. Absent, or missing on an item: the index. */
  keyBy?: string;
}

/**
 * An entry that repeats once per item of `each`.
 *
 * @example
 * const rows: ComponentListEntry = { key: "task-row", component: "TableRow", each: "scopes.root.tasks", as: "task" };
 */
export interface ComponentListEntry extends ComponentEntry {
  /** An expression returning the array to repeat over. */
  each: Expression;
  /** Names each item's two scopes: `scopes.<as>` is the item, `scopes.$<as>` its row. */
  as: string;
}

export function isComponentListEntry(entry: ComponentEntry): entry is ComponentListEntry {
  return entry.each !== undefined;
}

/**
 * Whether parsed JSON is an entry: string `key` and `component`, and `children`, if present, an array. The renderer
 * checks the other fields at mount.
 *
 * @example
 * const entries = parsedLines.filter(isComponentEntry);
 */
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

/**
 * A schema that validates at run time (Standard Schema) and converts to JSON Schema for the prompt (Standard JSON
 * Schema). Zod 4.2+, Valibot and ArkType schemas fit.
 *
 * @example
 * const props: CombinedSpec = z.strictObject({ text: z.string() });
 */
export type CombinedSpec<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output> &
  StandardJSONSchemaV1<Input, Output>;

/**
 * What the model reads about a component: its name, description, props and events. Make one with
 * `createComponentDefinition`.
 *
 * @example
 * const definitions: ComponentDefinition[] = [...defs, BadgeDef];
 * getComponentsPartialPrompt({ definitions });
 */
export type ComponentDefinition<
  TProps extends CombinedSpec = CombinedSpec,
  TCallbacks extends Record<string, CombinedSpec> = Record<string, CombinedSpec>,
> = {
  /** What an entry's `component` names, e.g. `"Badge"`. Must be unique: the prompt builder and `<RendererProvider>` throw on a repeat. */
  name: string;
  /** When to use the component, printed word for word in the prompt. */
  description: string;
  /** The props schema: the prompt prints it, and the renderer parses props through it before `render`. */
  props: TProps;
  /** Event name → payload schema, e.g. `{ onChange: z.object({ value: z.string() }), onClear: z.null() }`. */
  callbacks?: TCallbacks;
  /** Kept out of the prompt; an entry that names it still renders. */
  hidden?: boolean;
};

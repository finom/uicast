import type { StandardJSONSchemaV1, StandardSchemaV1 } from "@standard-schema/spec";
import { type EntryErrorReason, REASON_DESCRIPTIONS } from "../entry-error";

type Step = { set?: string; confirm?: string } & ({ expr: string } | { literal: unknown });

/**
 * What the model sends to the `expr` tool: steps to run and, with `read` on, an expression to read back.
 *
 * @example
 * const input: ExprToolInput = { steps: [{ set: "scopes.root.selected", literal: { "7": true } }] };
 */
export type ExprToolInput = { steps?: Step[]; read?: string };

/**
 * What the `expr` tool answers: the value of `read` (with `read` on), `declined` when the user declined a `confirm`, or the classified
 * error of the step or read that failed.
 *
 * @example
 * const output: ExprToolOutput = { error: { reason: "unknown-reference", message: "…" } };
 */
export type ExprToolOutput =
  | { value?: unknown }
  | { declined: true }
  | { error: { reason: EntryErrorReason; message: string } };

// A Standard Schema whose `validate` answers at once, with its JSON Schema.
type Schema<T> = {
  readonly "~standard": Omit<StandardSchemaV1.Props<unknown, T>, "validate"> &
    StandardJSONSchemaV1.Props<unknown, T> & { readonly validate: (value: unknown) => StandardSchemaV1.Result<T> };
};

type Issue = StandardSchemaV1.Issue;

// The schemas use nothing these drafts disagree on.
const TARGETS: ReadonlySet<string> = new Set(["draft-2020-12", "draft-07", "openapi-3.0"]);

const schema = <T>(json: Record<string, unknown>, check: (value: unknown) => Issue[]): Schema<T> => {
  const convert = ({ target }: StandardJSONSchemaV1.Options) => {
    if (!TARGETS.has(target)) throw new Error(`[uicast] The expr tool has no JSON Schema for "${target}".`);
    return structuredClone(json);
  };
  return {
    "~standard": {
      version: 1,
      vendor: "uicast",
      validate: (value) => {
        const issues = check(value);
        return issues.length ? { issues } : { value: value as T };
      },
      jsonSchema: { input: convert, output: convert },
    },
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unknownKeys = (value: Record<string, unknown>, keys: string[], path: PropertyKey[]): Issue[] =>
  Object.keys(value)
    .filter((key) => !keys.includes(key))
    .map((key) => ({ message: `Unknown key "${key}"`, path }));

const notString = (value: Record<string, unknown>, keys: string[], path: PropertyKey[]): Issue[] =>
  keys
    .filter((key) => key in value && typeof value[key] !== "string")
    .map((key) => ({ message: "Expected a string", path: [...path, key] }));

const target = {
  set: { type: "string", description: "scopes.root.<field> to write; absent: the step runs for its effect" },
  confirm: { type: "string", description: "Question the user confirms before this step runs" },
};

// A callback step: `expr` or `literal`, as `ValueSource` has it.
const stepJson = {
  anyOf: [
    {
      type: "object",
      properties: { ...target, expr: { type: "string", description: "Expression; its value is written to `set`" } },
      required: ["expr"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: { ...target, literal: { description: "JSON value written to `set`, instead of `expr`" } },
      required: ["literal"],
      additionalProperties: false,
    },
  ],
};

const checkStep = (step: unknown, path: PropertyKey[]): Issue[] => {
  if (!isObject(step)) return [{ message: "Expected an object", path }];
  if ("expr" in step === "literal" in step) return [{ message: 'Give either "expr" or "literal"', path }];
  return [
    ...unknownKeys(step, ["set", "confirm", "expr", "literal"], path),
    ...notString(step, ["set", "confirm", "expr"], path),
  ];
};

const stepsJson = { type: "array", items: stepJson, description: "Callback steps, run in order" };

const checkSteps = (steps: unknown): Issue[] =>
  steps === undefined
    ? []
    : Array.isArray(steps)
      ? steps.flatMap((step, i) => checkStep(step, ["steps", i]))
      : [{ message: "Expected an array", path: ["steps"] }];

const readInput = schema<ExprToolInput>(
  {
    type: "object",
    properties: {
      steps: stepsJson,
      read: { type: "string", description: "Expression whose value comes back, read after the steps" },
    },
    additionalProperties: false,
  },
  (input) => {
    if (!isObject(input)) return [{ message: "Expected an object" }];
    if (!("steps" in input || "read" in input)) return [{ message: 'Give "steps", "read" or both.' }];
    return [
      ...unknownKeys(input, ["steps", "read"], []),
      ...notString(input, ["read"], []),
      ...checkSteps(input.steps),
    ];
  },
);

const writeInput = schema<ExprToolInput>(
  { type: "object", properties: { steps: stepsJson }, required: ["steps"], additionalProperties: false },
  (input) => {
    if (!isObject(input)) return [{ message: "Expected an object" }];
    const { read, ...rest } = input;
    const off: Issue[] = read === undefined ? [] : [{ message: "Off: this tool sends no value back", path: ["read"] }];
    if (!("steps" in input)) return [...off, { message: 'Give "steps".' }];
    return [...off, ...unknownKeys(rest, ["steps"], []), ...checkSteps(input.steps)];
  },
);

const reasons = Object.keys(REASON_DESCRIPTIONS);

const isAnswer = (output: unknown, read: boolean): boolean => {
  if (!isObject(output)) return false;
  const [key, ...rest] = Object.keys(output);
  if (rest.length > 0) return false;
  if (key === undefined) return true;
  if (key === "value") return read;
  if (key === "declined") return output.declined === true;
  const { error } = output;
  return (
    key === "error" &&
    isObject(error) &&
    Object.keys(error).length === 2 &&
    reasons.includes(error.reason as string) &&
    typeof error.message === "string"
  );
};

const answers = (read: boolean) =>
  schema<ExprToolOutput>(
    {
      anyOf: [
        { type: "object", properties: read ? { value: {} } : {}, additionalProperties: false },
        {
          type: "object",
          properties: { declined: { type: "boolean", enum: [true] } },
          required: ["declined"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: { reason: { type: "string", enum: reasons }, message: { type: "string" } },
              required: ["reason", "message"],
              additionalProperties: false,
            },
          },
          required: ["error"],
          additionalProperties: false,
        },
      ],
    },
    (output) =>
      isAnswer(output, read)
        ? []
        : [
            {
              message: `Expected ${read ? "{ value }, " : "{}, "}{ declined: true } or { error: { reason, message } }`,
            },
          ],
  );

const SCHEMAS = {
  read: { input: readInput, output: answers(true) },
  write: { input: writeInput, output: answers(false) },
};

// The tool's schemas: with `read`, a call may ask for a value back; without it, only steps run.
export const exprToolSchemas = (read: boolean) => SCHEMAS[read ? "read" : "write"];

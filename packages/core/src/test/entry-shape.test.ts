import { describe, expect, it } from "vitest";
import { entryShapeError } from "../entry-shape";

// Parsed, as model output is: the line only claims the entry type.
const line = (json: string) => JSON.parse(json);

describe("entryShapeError", () => {
  it.each([
    ['{"key":"a","component":"Box","seed":"oops"}', '"seed" must be an array of steps, got a string.'],
    ['{"key":"a","component":"Box","seed":[5]}', '"seed[0]" must be a step'],
    ['{"key":"a","component":"Box","seed":[{"literal":1}]}', '"seed[0]" has no "set"'],
    ['{"key":"a","component":"Box","seed":[{"set":1,"literal":1}]}', '"seed[0].set" must be an address string'],
    ['{"key":"a","component":"Box","callbacks":"oops"}', '"callbacks" must be an object of step arrays'],
    ['{"key":"a","component":"Box","callbacks":{"onClick":"oops"}}', '"callbacks.onClick" must be an array of steps'],
    [
      '{"key":"a","component":"Box","callbacks":{"onClick":[{"expr":"x()","confirm":true}]}}',
      '"callbacks.onClick[0].confirm"',
    ],
    [
      '{"key":"a","component":"Box","callbacks":{"onClick":[{"expr":"x()","debounce":"yes"}]}}',
      '"callbacks.onClick[0].debounce"',
    ],
    [
      '{"key":"a","component":"Box","callbacks":{"onClick":[{"expr":{"a":1}}]}}',
      '"callbacks.onClick[0].expr" must be an expression string',
    ],
    [
      '{"key":"a","component":"Box","props":"oops"}',
      '"props" must be { "expr": "…" } or { "literal": … }, got a string.',
    ],
    ['{"key":"a","component":"Box","props":{"expr":5}}', '"props.expr" must be an expression string, got a number.'],
    ['{"key":"a","component":"Box","hidden":{"expr":"x"}}', '"hidden" must be a string, got an object.'],
    ['{"key":"a","component":"Box","loading":true}', '"loading" must be a string, got a boolean.'],
    ['{"key":"a","component":"Box","each":["x"],"as":"row"}', '"each" must be a string, got an array.'],
    ['{"key":"a","component":"Box","each":"scopes.root.rows"}', 'A list needs "as"'],
    ['{"key":"a","component":"Box","each":"scopes.root.rows","as":"$row"}', 'starts with "$"'],
    ['{"key":"a","component":"Box","each":"scopes.root.rows","as":"row","keyBy":1}', '"keyBy" must be a string'],
    ['{"key":"a","component":"Box","children":"b"}', '"children" must be an array of element keys, got a string.'],
    ['{"key":"a","component":"Box","children":["b",null]}', '"children[1]" must be an element key string, got null.'],
  ])("refuses %s", (json, message) => {
    const error = entryShapeError(line(json));
    expect(error?.reason).toBe("invalid-entry");
    expect(error?.fault).toBe("document");
    expect(error?.elementKey).toBe("a");
    expect(error?.message).toContain(message);
  });

  it.each([
    '{"key":"a","component":"Box"}',
    '{"key":"a","component":"Box","props":{"literal":null},"hidden":"false","loading":"scopes.root.busy"}',
    '{"key":"a","component":"Box","seed":[{"set":"scopes.root.x","expr":"1"},{"set":"scopes.root.y","literal":[1]}]}',
    '{"key":"a","component":"Box","callbacks":{"onClick":[{"expr":"del()","confirm":"Sure?"},{"set":"scopes.root.q","expr":"evt.value","debounce":true}]}}',
    '{"key":"a","component":"Box","callbacks":{"onClick":[{"set":"scopes.root.x"}]}}',
    '{"key":"a","component":"Box","each":"scopes.root.rows","as":"row","keyBy":"id","children":["b"]}',
  ])("accepts %s", (json) => {
    expect(entryShapeError(line(json))).toBeNull();
  });
});

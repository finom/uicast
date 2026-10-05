import { describe, expect, it, vi } from "vitest";
import { Evaluator, ExpressionError, type StandardToolV0 } from "../index";

type Schema = NonNullable<StandardToolV0["inputSchema"]>;

const numberSchema = (opts: { async?: boolean; coerce?: boolean } = {}): Schema => {
  const check = (value: unknown) =>
    typeof value === "number"
      ? { value: opts.coerce ? value * 10 : value }
      : { issues: [{ message: "expected a number" }] };
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: (value: unknown) => (opts.async ? Promise.resolve(check(value)) : check(value)),
      jsonSchema: () => ({ type: "number" }),
    },
  } as unknown as Schema;
};

const tool = (t: Partial<StandardToolV0> & { name: string }): StandardToolV0 =>
  ({ description: "", execute: (input: unknown) => input, ...t }) as StandardToolV0;

describe("construction", () => {
  it("refuses a name no expression could call", () => {
    for (const name of ["foo-bar", "class", "2fast", ""]) {
      expect(() => new Evaluator({ functions: [tool({ name })] }), name).toThrow(ExpressionError);
    }
  });

  it("refuses duplicate names", () => {
    expect(() => new Evaluator({ functions: [tool({ name: "a" }), tool({ name: "a" })] })).toThrow(
      /Duplicate host function name/,
    );
  });

  it("reports the tools an expression calls", () => {
    const ev = new Evaluator({ functions: [tool({ name: "load" }), tool({ name: "save" })] });
    expect(ev.validate("load(1)").toolCalls).toEqual(["load"]);
    expect(ev.validate("scopes.x").toolCalls).toEqual([]);
  });
});

describe("staying synchronous", () => {
  const sync = (opts: { input?: boolean; output?: boolean }) =>
    new Evaluator({
      functions: [
        tool({
          name: "f",
          inputSchema: opts.input ? numberSchema() : undefined,
          outputSchema: opts.output ? numberSchema() : undefined,
          execute: (input) => input,
        }),
      ],
    });

  it("allocates no promise when the tool and both schemas are synchronous", () => {
    for (const opts of [{}, { input: true }, { output: true }, { input: true, output: true }]) {
      expect(sync(opts).eval("f(1)"), JSON.stringify(opts)).toBe(1);
    }
  });

  it("returns the tool's own value, not a copy", () => {
    const value = { rows: [1, 2] };
    const ev = new Evaluator({ functions: [tool({ name: "f", execute: () => value })] });
    expect(ev.eval("f()")).toBe(value);
  });

  it("runs the whole call before eval returns", () => {
    const seen: string[] = [];
    const ev = new Evaluator({
      functions: [
        tool({
          name: "f",
          execute: () => {
            seen.push("executed");
            return 1;
          },
        }),
      ],
    });
    ev.eval("f()");
    expect(seen).toEqual(["executed"]);
  });

  it("goes async only where a promise actually appears", () => {
    const cases: [string, Evaluator][] = [
      [
        "async input schema",
        new Evaluator({
          functions: [tool({ name: "f", inputSchema: numberSchema({ async: true }) })],
        }),
      ],
      ["async execute", new Evaluator({ functions: [tool({ name: "f", execute: async (i) => i })] })],
      [
        "async output schema",
        new Evaluator({
          functions: [tool({ name: "f", outputSchema: numberSchema({ async: true }) })],
        }),
      ],
    ];
    for (const [label, ev] of cases) {
      expect(ev.eval("f(1)"), label).toBeInstanceOf(Promise);
    }
  });
});

describe("validation", () => {
  it("rejects a bad argument as invalid-arguments", () => {
    const ev = new Evaluator({
      functions: [tool({ name: "f", inputSchema: numberSchema() })],
    });
    expect(() => ev.eval(`f("nope")`)).toThrow(expect.objectContaining({ reason: "invalid-arguments" }));
  });

  it("rejects a bad return as host-function — the host's problem, not the document's", () => {
    const ev = new Evaluator({
      functions: [tool({ name: "f", outputSchema: numberSchema(), execute: () => "nope" })],
    });
    expect(() => ev.eval("f(1)")).toThrow(expect.objectContaining({ reason: "host-function" }));
  });

  it("passes the validated value to execute, not the raw input", () => {
    const execute = vi.fn((input: unknown) => input);
    const ev = new Evaluator({
      functions: [tool({ name: "f", inputSchema: numberSchema({ coerce: true }), execute })],
    });
    expect(ev.eval("f(2)")).toBe(20);
    expect(execute).toHaveBeenCalledWith(20);
  });

  it("skips validation the tool did not ask for", () => {
    const ev = new Evaluator({ functions: [tool({ name: "f" })] });
    expect(ev.eval(`f("anything")`)).toBe("anything");
  });

  it("awaits an async input schema before executing", async () => {
    const ev = new Evaluator({
      functions: [tool({ name: "f", inputSchema: numberSchema({ async: true }) })],
    });
    await expect(ev.eval<Promise<unknown>>(`f("nope")`)).rejects.toThrow(
      expect.objectContaining({ reason: "invalid-arguments" }),
    );
  });
});

describe("failures", () => {
  it("keeps the host's message and the original error", () => {
    const boom = new Error("server unreachable");
    const ev = new Evaluator({
      functions: [
        tool({
          name: "f",
          execute: () => {
            throw boom;
          },
        }),
      ],
    });
    try {
      ev.eval("f()");
      expect.unreachable();
    } catch (err) {
      expect(ExpressionError.is(err)).toBe(true);
      // The recovery prompt shows this message to the model.
      expect((err as Error).message).toContain("server unreachable");
      expect((err as ExpressionError).reason).toBe("host-function");
      expect((err as Error).cause).toBe(boom);
    }
  });

  it("names a thrown non-Error in the message", () => {
    const ev = new Evaluator({
      functions: [
        tool({
          name: "f",
          execute: () => {
            throw "offline";
          },
        }),
      ],
    });
    expect(() => ev.eval("f()")).toThrow('"f" failed: offline');
  });

  it("blames the host for a schema that throws or returns a thenable that is not a Promise", () => {
    const schema = (validate: () => unknown) =>
      ({ "~standard": { version: 1, vendor: "test", validate } }) as unknown as Schema;
    const throwing = schema(() => {
      throw new Error("schema bug");
    });
    // biome-ignore lint/suspicious/noThenProperty: a thenable that is not a Promise is the case under test
    const thenable = schema(() => ({ then: () => {} }));
    for (const [inputSchema, message] of [
      [throwing, '"f" failed: schema bug'],
      [thenable, '"f" schema returned a thenable that is not a Promise'],
    ] as const) {
      const ev = new Evaluator({ functions: [tool({ name: "f", inputSchema })] });
      expect(() => ev.eval("f(1)")).toThrow(expect.objectContaining({ reason: "host-function", message }));
    }
  });

  it("classifies a rejected promise the same way", async () => {
    const boom = new Error("gone");
    const ev = new Evaluator({
      functions: [tool({ name: "f", execute: async () => Promise.reject(boom) })],
    });
    await expect(ev.eval<Promise<unknown>>("f()")).rejects.toThrow(
      expect.objectContaining({ reason: "host-function", cause: boom }),
    );
  });
});

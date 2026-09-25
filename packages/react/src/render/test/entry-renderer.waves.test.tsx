import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Evaluator } from "@uicast/expr";
import { standardTool } from "standard-tool";
import { z } from "zod";
import type { ComponentEntry } from "@uicast/core";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { defaultImplementationsList } from "../../../test/render-helpers";

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe("dependency waves", () => {
  it("a seed step reads an earlier seed step's write", async () => {
    const seen: unknown[] = [];
    const getWeather = standardTool({
      name: "getWeather",
      description: "weather",
      inputSchema: z.object({ city: z.string() }),
      outputSchema: z.object({ tempC: z.number() }),
      execute: async ({ city }) => {
        seen.push(city);
        return { tempC: 14 };
      },
    });
    const functions = [getWeather];
    const evaluator = new Evaluator({ functions });
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [
          { set: "scopes.root.city", literal: "Amsterdam" },
          { set: "scopes.root.weather", expr: "getWeather({ city: scopes.root.city })" },
        ],
        props: { expr: "({ text: scopes.root.city + ': ' + scopes.root.weather?.tempC })" },
      },
    ];
    const { container } = render(
      <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    await waitFor(() => {
      expect(container.textContent).toContain("Amsterdam: 14");
    });
    expect(seen).toEqual(["Amsterdam"]);
  });

  it("independent async seed steps run in parallel", async () => {
    const a = deferred<number>();
    const b = deferred<number>();
    const started: string[] = [];
    const loadA = standardTool({
      name: "loadA",
      description: "a",
      outputSchema: z.number(),
      execute: () => {
        started.push("a");
        return a.promise;
      },
    });
    const loadB = standardTool({
      name: "loadB",
      description: "b",
      outputSchema: z.number(),
      execute: () => {
        started.push("b");
        return b.promise;
      },
    });
    const functions = [loadA, loadB];
    const evaluator = new Evaluator({ functions });
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [
          { set: "scopes.root.a", expr: "loadA()" },
          { set: "scopes.root.b", expr: "loadB()" },
        ],
        props: { expr: "({ text: scopes.root.a + '+' + scopes.root.b })" },
      },
    ];
    const { container } = render(
      <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    await waitFor(() => {
      expect(started).toEqual(["a", "b"]);
    });
    await act(async () => {
      a.resolve(1);
      b.resolve(2);
    });
    await waitFor(() => {
      expect(container.textContent).toContain("1+2");
    });
  });

  it("a callback step reads earlier steps' writes across waves", async () => {
    const started: string[] = [];
    const slowEcho = standardTool({
      name: "slowEcho",
      description: "echo",
      inputSchema: z.object({ v: z.string() }),
      outputSchema: z.string(),
      execute: async ({ v }) => {
        started.push(v);
        return v;
      },
    });
    const functions = [slowEcho];
    const evaluator = new Evaluator({ functions });
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["btn", "out"] },
      {
        key: "btn",
        component: "Button",
        props: { literal: { label: "run-chain" } },
        callbacks: {
          onClick: [
            { set: "scopes.root.x", expr: "slowEcho({ v: 'x' })" },
            { set: "scopes.root.y", expr: "slowEcho({ v: 'y' })" },
            { set: "scopes.root.sum", expr: "slowEcho({ v: scopes.root.x + scopes.root.y })" },
          ],
        },
      },
      {
        key: "out",
        component: "Box",
        props: { expr: "({ text: 'sum:' + scopes.root.sum })" },
      },
    ];
    const { container, getByText } = render(
      <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    await act(async () => {
      fireEvent.click(getByText("run-chain"));
    });
    await waitFor(() => {
      expect(container.textContent).toContain("sum:xy");
    });
    expect(started).toEqual(["x", "y", "xy"]);
  });

  it("host-function steps never race — mutate then refetch stays ordered", async () => {
    const order: string[] = [];
    const del = standardTool({
      name: "del",
      description: "delete",
      outputSchema: z.string(),
      execute: async () => {
        order.push("del-start");
        await new Promise((r) => setTimeout(r, 30));
        order.push("del-done");
        return "ok";
      },
    });
    const list = standardTool({
      name: "list",
      description: "list",
      outputSchema: z.string(),
      execute: async () => {
        order.push("list-start");
        return "rows";
      },
    });
    const functions = [del, list];
    const evaluator = new Evaluator({ functions });
    const lines: ComponentEntry[] = [
      {
        key: "btn",
        component: "Button",
        props: { literal: { label: "run-mutate" } },
        callbacks: {
          onClick: [
            { expr: "del()" },
            // Reads nothing `del` writes: only the host-function barrier orders them.
            { set: "scopes.root.rows", expr: "list()" },
          ],
        },
      },
    ];
    const { getByText } = render(
      <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    await act(async () => {
      fireEvent.click(getByText("run-mutate"));
    });
    await waitFor(() => {
      expect(order).toEqual(["del-start", "del-done", "list-start"]);
    });
  });

  it("a failed wave still skips later waves", async () => {
    const onError = vi.fn();
    const boom = standardTool({
      name: "boom",
      description: "throws",
      outputSchema: z.string(),
      execute: async () => {
        throw new Error("nope");
      },
    });
    const after = vi.fn(async () => "never");
    const afterTool = standardTool({
      name: "afterTool",
      description: "later",
      outputSchema: z.string(),
      execute: after,
    });
    const functions = [boom, afterTool];
    const evaluator = new Evaluator({ functions });
    const lines: ComponentEntry[] = [
      {
        key: "btn",
        component: "Button",
        props: { literal: { label: "run-fail" } },
        callbacks: {
          onClick: [
            { set: "scopes.root.a", expr: "boom()" },
            { set: "scopes.root.b", expr: "afterTool({}) && scopes.root.a" },
          ],
        },
      },
    ];
    const { getByText } = render(
      <RendererProvider implementations={defaultImplementationsList} evaluator={evaluator} onError={onError}>
        <EntriesRenderer entries={lines} />
      </RendererProvider>,
    );
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      fireEvent.click(getByText("run-fail"));
    });
    await waitFor(() => {
      expect(onError).toHaveBeenCalledOnce();
    });
    spy.mockRestore();
    expect(after).not.toHaveBeenCalled();
  });
});

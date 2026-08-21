import { describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { Renderer } from "@uicast/react";
import type { ComponentEntry } from "uicast";
import type { StandardToolV0 } from "standard-tool";
import {
  defaultImplementationsList,
  mountEntries,
} from "../../../test/render-helpers";

// Blast-radius edges around subscriptions and async seeds: failures must stay
// on the element that carries them, and transient failures must clear.

const errorSlot = {
  error: ({ error, elementKey }: { error: Error; elementKey?: string }) => (
    <div data-error-for={elementKey}>
      {elementKey} failed: {error.message}
    </div>
  ),
};

describe("EntryRenderer — containment edges", () => {
  it("a bare whole-scope read renders fine and does not latch the parent", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'parent-alive' })" },
        children: ["reader"],
      },
      {
        key: "reader",
        // Reads the whole scope object — a valid expression whose dep
        // ("scopes.root") is not a subscribable path. Must not throw in the
        // subscription effect (which would latch the PARENT's boundary).
        component: "Box",
        props: { expr: "({ text: 'keys:' + Object.keys(scopes.root).length })" },
      },
    ];
    const { container } = mountEntries(lines, { defaultComponents: errorSlot });
    expect(container.textContent).toContain("parent-alive");
    expect(container.textContent).toContain("keys:");
    expect(container.textContent).not.toContain("failed:");
  });

  it("recovers when the Suspense fallback throws against pre-seed state and the seed then lands", async () => {
    let release: (rows: string[]) => void = () => {};
    const gate = new Promise<string[]>((resolve) => {
      release = resolve;
    });
    const functions: StandardToolV0[] = [
      { name: "fetchRows", description: "", execute: () => gate },
    ];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["widget"] },
      {
        key: "widget",
        component: "Box",
        seed: [{ set: "scopes.root.rows", expr: "fetchRows()" }],
        // Throws while rows is undefined — i.e. in the Suspense fallback,
        // which renders the component against pre-seed state.
        props: { expr: "({ text: 'first:' + scopes.root.rows[0] })" },
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = mountEntries(lines, {
        functions,
        defaultComponents: errorSlot,
      }));
    });
    // Pre-seed render failed and latched.
    await waitFor(() => {
      expect(container.textContent).toContain("widget failed:");
    });

    await act(async () => {
      release(["ready"]);
    });
    // Seed settles → reset token flips back to the entry → fresh attempt
    // against seeded state succeeds. No re-emission needed.
    await waitFor(() => {
      expect(container.textContent).toContain("first:ready");
    });
    expect(container.textContent).not.toContain("widget failed:");
    consoleError.mockRestore();
  });

  it("attempts a failed host `init` once, not once per stream tick", async () => {
    const init = vi.fn(async () => {
      throw new Error("INIT_FAIL");
    });
    // `b` and `c` are referenced up front, so the ROOT SET never changes as
    // they stream in — only the entries map does. (Adding a new root entry
    // would rebuild the synthetic root and legitimately re-attempt init.)
    const initialLines: ComponentEntry[] = [
      {
        key: "a",
        component: "Box",
        props: { literal: { text: "hello" } },
        children: ["b", "c"],
      },
    ];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(
        <Renderer
          implementations={defaultImplementationsList}
          entries={initialLines}
          init={init}
        />,
      );
    });
    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(1);
    });
    // Stream the children in — each tick swaps the store map. The synthetic
    // root keeps its identity while the root set is unchanged, so the failed
    // init must NOT retry per tick.
    const emit = async (...more: ComponentEntry[]) => {
      initialLines.push(...more);
      await act(async () => {
        view.rerender(
          <Renderer
            implementations={defaultImplementationsList}
            entries={[...initialLines]}
            init={init}
          />,
        );
      });
    };
    await emit({ key: "b", component: "Box", props: { literal: { text: "x1" } } });
    await emit({ key: "c", component: "Box", props: { literal: { text: "x2" } } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(init).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});

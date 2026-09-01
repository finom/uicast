import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { z } from "zod";
import {
  createComponentDefinition,
  type EntryError,
  type ComponentEntry,
} from "@uicast/core";
import type { StandardToolV0 } from "standard-tool";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";
import {
  defaultImplementationsList,
  mountEntries,
} from "../../../test/render-helpers";

// Classification end-to-end: every failure reaching the error slot or onError
// is an EntryError whose reason was tagged at the throw site.

const collect = () => {
  const seen: EntryError[] = [];
  return { seen, onError: (err: EntryError) => seen.push(err) };
};

describe("EntryRenderer — EntryError classification", () => {
  it("reports an implementation crash on legal props as `implementation`", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { seen, onError } = collect();
    const lines: ComponentEntry[] = [{ key: "root", component: "Thrower" }];
    mountEntries(lines, { onError });
    expect(seen).toHaveLength(1);
    expect(seen[0].reason).toBe("implementation");
    expect(seen[0].fault).toBe("environment");
    expect(seen[0].elementKey).toBe("root");
    consoleError.mockRestore();
  });

  it("reports a crash on schema-violating props as `invalid-props`", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const strictDef = createComponentDefinition({
      name: "Strict",
      description: "Requires a string value",
      props: z.object({ value: z.string() }),
    });
    const strictImpl = createComponentImplementation({
      def: strictDef,
      render: ({ value }) => <div>{value.toUpperCase()}</div>,
    });
    const { seen, onError } = collect();
    const lines: ComponentEntry[] = [
      // No props at all — `value` is required, and the render crashes on it.
      { key: "root", component: "Strict" },
    ];
    mountEntries(lines, {
      implementations: { Strict: strictImpl },
      onError,
    });
    expect(seen[0]?.reason).toBe("invalid-props");
    expect(seen[0]?.fault).toBe("document");
    consoleError.mockRestore();
  });

  it("reports an unregistered function call as `unknown-reference`", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { seen, onError } = collect();
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: nope() })" },
      },
    ];
    const { container } = mountEntries(lines, { onError });
    expect(container.textContent).toContain("Render error:");
    expect(seen[0]?.reason).toBe("unknown-reference");
    expect(seen[0]?.fault).toBe("document");
    consoleError.mockRestore();
  });

  it("reports a failing host function in a callback as `host-function` via onError", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { seen, onError } = collect();
    const functions: StandardToolV0[] = [
      {
        name: "boom",
        description: "",
        execute: async () => {
          throw new Error("server down");
        },
      },
    ];
    const lines: ComponentEntry[] = [
      {
        key: "btn",
        component: "Button",
        props: { literal: { label: "go" } },
        callbacks: { onClick: [{ set: "scopes.root.result", expr: "boom()" }] },
      },
    ];
    const { container } = mountEntries(lines, { functions, onError });
    fireEvent.click(within(container).getByRole("button"));
    await waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    expect(seen[0].reason).toBe("host-function");
    expect(seen[0].fault).toBe("environment");
    expect(seen[0].elementKey).toBe("btn");
    // The callback failure is contained — the button is still there.
    expect(container.querySelector("button")).not.toBeNull();
    consoleError.mockRestore();
  });

  it("reports a failing host `init` as `host-init` through the Renderer prop", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { seen, onError } = collect();
    const lines: ComponentEntry[] = [
      { key: "a", component: "Box", props: { literal: { text: "hi" } } },
    ];
    render(
      <RendererProvider implementations={defaultImplementationsList} init={() => { throw new Error("bootstrap failed"); }} onError={onError}><EntriesRenderer entries={lines} /></RendererProvider>,
    );
    await waitFor(() => {
      expect(seen).toHaveLength(1);
    });
    expect(seen[0].reason).toBe("host-init");
    expect(seen[0].fault).toBe("environment");
    consoleError.mockRestore();
  });

  it("rejects a numeric-key callback `set` path at mount as `guardrail-violation`", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { seen, onError } = collect();
    const lines: ComponentEntry[] = [
      {
        key: "grid",
        component: "Box",
        props: { literal: { text: "cells" } },
        callbacks: { onClick: [{ set: "scopes.root.rows.0.qty", literal: 3 }] },
      },
    ];
    const { container } = mountEntries(lines, { onError });
    // Rejected off the entry's static strings — no click needed.
    expect(seen).toHaveLength(1);
    expect(seen[0].reason).toBe("guardrail-violation");
    expect(seen[0].fault).toBe("document");
    expect(seen[0].elementKey).toBe("grid");
    expect(container.textContent).toContain("numeric key");
    consoleError.mockRestore();
  });

  it("rejects a numeric-key seed `set` path as `guardrail-violation`", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { seen, onError } = collect();
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        seed: [{ set: "scopes.root.rows.0", literal: 1 }],
      },
    ];
    mountEntries(lines, { onError });
    expect(seen[0]?.reason).toBe("guardrail-violation");
    expect(seen[0]?.fault).toBe("document");
    consoleError.mockRestore();
  });
});

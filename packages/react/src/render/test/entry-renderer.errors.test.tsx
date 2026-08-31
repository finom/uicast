import { describe, expect, it, vi } from "vitest";
import type { StandardToolV0 } from "standard-tool";
import type { EntryError, ComponentEntry } from "@uicast/core";
import { mountEntries } from "../../../test/render-helpers";

describe("EntryRenderer — errors", () => {
  it("routes an unregistered component through the error slot as unknown-component", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "DoesNotExist",
      },
    ];
    const seen: EntryError[] = [];
    const { container } = mountEntries(lines, {
      fallbackComponents: {
        error: ({ error, elementKey }) => {
          seen.push(error);
          return (
            <div>
              {elementKey} errored ({error.reason}): {error.message}
            </div>
          );
        },
      },
    });
    expect(container.textContent).toContain(
      "root errored (unknown-component): Unknown component: DoesNotExist",
    );
    expect(seen[0]?.fault).toBe("document");
    consoleError.mockRestore();
  });

  it("recovers when a re-emission fixes the component name", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Bocks",
        props: { expr: "({ text: 'healed' })" },
      },
    ];
    const { container, emit } = mountEntries(lines);
    expect(container.textContent).toContain("Unknown component: Bocks");

    // Partial replacement with the corrected name — fresh entry identity
    // resets the boundary, and the element renders for real.
    emit({
      key: "root",
      component: "Box",
      props: { expr: "({ text: 'healed' })" },
    });
    expect(container.textContent).toContain("healed");
    expect(container.textContent).not.toContain("Unknown component");
    consoleError.mockRestore();
  });

  it("default error fallback shows the thrown message", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Thrower",
      },
    ];
    const { container } = mountEntries(lines);
    expect(container.textContent).toContain(
      "Render error: BOOM_FROM_THROWER",
    );
    consoleError.mockRestore();
  });

  it("renders the fallbackComponents.error slot when a renderer throws", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Thrower",
      },
    ];
    const { container } = mountEntries(lines, {
      fallbackComponents: {
        error: ({ error, elementKey }) => (
          <div>
            {elementKey} failed: {error.message}
          </div>
        ),
      },
    });
    expect(container.textContent).toContain("root failed: BOOM_FROM_THROWER");
    consoleError.mockRestore();
  });

  it("ErrorBoundary contains throws inside a renderer (siblings keep rendering)", () => {
    // Silence the expected error noise from React's dev-mode logger so the
    // test output stays clean. We're explicitly exercising an error path.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        children: ["bad", "good"],
      },
      {
        key: "bad",
        component: "Thrower",
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'sibling-survives' })" },
      },
    ];
    const { container } = mountEntries(lines);
    // The thrower is wrapped in <ErrorBoundary>, so the parent + sibling
    // entries still render.
    expect(container.textContent).toContain("sibling-survives");
    consoleError.mockRestore();
  });
});

// The contract bans host functions (and `await`) in reactive sites — they
// re-evaluate on every state change. The engine throws a classified error
// instead of letting the Promise leak into render as a truthy object.
describe("EntryRenderer — host function call in a reactive site", () => {
  const functions: StandardToolV0[] = [
    { name: "loadThing", description: "", execute: async () => "value" },
  ];

  const mountLine = (line: ComponentEntry) => {
    const seen: EntryError[] = [];
    const result = mountEntries([line], {
      functions,
      onError: (error) => seen.push(error),
      fallbackComponents: {
        error: ({ error }) => <div>slot: {error.reason}</div>,
      },
    });
    return { ...result, seen };
  };

  it("props evaluating to a Promise fails as guardrail-violation", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { container, seen } = mountLine({
      key: "root",
      component: "Box",
      props: { expr: "loadThing()" },
    });
    expect(container.textContent).toContain("slot: guardrail-violation");
    expect(seen[0]?.reason).toBe("guardrail-violation");
    consoleError.mockRestore();
  });

  it("hidden evaluating to a Promise fails as guardrail-violation", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { container, seen } = mountLine({
      key: "root",
      component: "Box",
      hidden: "loadThing()",
      props: { expr: "({ text: 'never-shown' })" },
    });
    expect(container.textContent).toContain("slot: guardrail-violation");
    expect(seen[0]?.reason).toBe("guardrail-violation");
    consoleError.mockRestore();
  });

  it("a list each evaluating to a Promise fails as guardrail-violation", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { container, seen } = mountLine({
      key: "root",
      component: "Box",
      each: "loadThing()",
      as: "row",
      props: { expr: "({ text: scopes.row.item })" },
    });
    expect(container.textContent).toContain("slot: guardrail-violation");
    expect(seen[0]?.reason).toBe("guardrail-violation");
    consoleError.mockRestore();
  });
});

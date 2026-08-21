import { describe, expect, it, vi } from "vitest";
import type { EntryError, ComponentEntry } from "uicast";
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
      defaultComponents: {
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

  it("renders the defaultComponents.error slot when a renderer throws", () => {
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
      defaultComponents: {
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

  it("ErrorBoundary catches an expression-evaluation error too", () => {
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
        component: "Box",
        // Reads a path through `null`, triggering a runtime error inside evaluate().
        props: { expr: "({ text: scopes.root.missing.deeper.fragile })" },
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'still-here' })" },
      },
    ];
    const { container } = mountEntries(lines, {
      rootScope: { missing: null },
    });
    expect(container.textContent).toContain("still-here");
    consoleError.mockRestore();
  });
});

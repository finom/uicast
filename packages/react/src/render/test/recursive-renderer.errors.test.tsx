import { describe, expect, it, vi } from "vitest";
import type { ComponentEntry } from "@ui-fired/core";
import { mountChunks } from "../../../test/render-helpers";

describe("RecursiveRenderer — errors", () => {
  it("renders an inline fallback when the component is not in the registry", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "DoesNotExist",
      },
    ];
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain("Unknown component: DoesNotExist");
  });

  it("renders the systemVisuals.unknown slot when supplied", () => {
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "DoesNotExist",
      },
    ];
    const { container } = mountChunks(lines, {
      systemVisuals: {
        unknown: ({ componentName, elementKey }) => (
          <div>
            {elementKey} misses {componentName}
          </div>
        ),
      },
    });
    expect(container.textContent).toContain("root misses DoesNotExist");
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
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain(
      "Render error: BOOM_FROM_THROWER",
    );
    consoleError.mockRestore();
  });

  it("renders the systemVisuals.error slot when a renderer throws", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Thrower",
      },
    ];
    const { container } = mountChunks(lines, {
      systemVisuals: {
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
    const { container } = mountChunks(lines);
    // The thrower is wrapped in <ErrorBoundary>, so the parent + sibling
    // chunks still render.
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
    const { container } = mountChunks(lines, {
      rootScope: { missing: null },
    });
    expect(container.textContent).toContain("still-here");
    consoleError.mockRestore();
  });
});

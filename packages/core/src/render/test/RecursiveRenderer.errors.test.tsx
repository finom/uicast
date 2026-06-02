import { describe, expect, it, vi } from "vitest";
import type { ChunkComponent } from "@ui-fired/core/types";
import { mountChunks } from "../../../test/renderHelpers";

describe("RecursiveRenderer — errors", () => {
  it("renders an inline fallback when the component is not in the registry", () => {
    const lines: ChunkComponent[] = [
      {
        key: "root",
        component: "DoesNotExist",
      },
    ];
    const { container } = mountChunks(lines);
    expect(container.textContent).toContain("Unknown component: DoesNotExist");
  });

  it("ErrorBoundary contains throws inside a renderer (siblings keep rendering)", () => {
    // Silence the expected error noise from React's dev-mode logger so the
    // test output stays clean. We're explicitly exercising an error path.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const lines: ChunkComponent[] = [
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

    const lines: ChunkComponent[] = [
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

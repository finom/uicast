import { describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import type { ComponentEntry } from "@uicast/core";
import type { StandardToolV0 } from "standard-tool";
import { mountEntries } from "../../../test/render-helpers";

const errorSlot = {
  error: ({ error, elementKey }: { error: Error; elementKey?: string }) => (
    <div data-error-for={elementKey}>
      {elementKey} failed: {error.message}
    </div>
  ),
};

const silenceConsoleError = () =>
  vi.spyOn(console, "error").mockImplementation(() => {});

describe("EntryRenderer — error recovery via re-emission", () => {
  it("recovers when a re-emit fixes a prohibited-global `hidden` expression", () => {
    const consoleError = silenceConsoleError();
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["bad", "good"] },
      {
        key: "bad",
        component: "Box",
        props: { expr: "({ text: 'never-shown' })" },
        hidden: "document.title",
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'sibling-alive' })" },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      fallbackComponents: errorSlot,
    });
    expect(container.textContent).toContain("bad failed:");
    expect(container.textContent).toContain("sibling-alive");

    emit({
      key: "bad",
      component: "Box",
      props: { expr: "({ text: 'recovered' })" },
    });
    expect(container.textContent).not.toContain("bad failed:");
    expect(container.textContent).toContain("recovered");
    consoleError.mockRestore();
  });

  it("contains a syntactically invalid expression to its element (parent + sibling survive) and recovers", () => {
    const consoleError = silenceConsoleError();
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'parent-alive' })" },
        children: ["bad", "good"],
      },
      {
        key: "bad",
        component: "Box",
        // Unparseable — throws in evaluate() AND in dep extraction.
        props: { expr: "..broken" },
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'sibling-alive' })" },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      fallbackComponents: errorSlot,
    });
    expect(container.textContent).toContain("parent-alive");
    expect(container.textContent).toContain("sibling-alive");
    expect(container.textContent).toContain("bad failed:");

    emit({
      key: "bad",
      component: "Box",
      props: { expr: "({ text: 'recovered' })" },
    });
    expect(container.textContent).not.toContain("bad failed:");
    expect(container.textContent).toContain("recovered");
    consoleError.mockRestore();
  });

  it("contains a bad `each` to the list slot (not the parent) and recovers into a working list", () => {
    const consoleError = silenceConsoleError();
    const lines: ComponentEntry[] = [
      {
        key: "root",
        component: "Box",
        props: { expr: "({ text: 'parent-alive' })" },
        children: ["the-list", "good"],
      },
      {
        key: "the-list",
        component: "Box",
        each: "document.rows",
        as: "row",
        props: { expr: "({ text: scopes.row.$$value })" },
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'sibling-alive' })" },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      rootScope: { items: ["first-item", "second-item"] },
      fallbackComponents: errorSlot,
    });
    expect(container.textContent).toContain("parent-alive");
    expect(container.textContent).toContain("sibling-alive");
    expect(container.textContent).toContain("the-list failed:");

    emit({
      key: "the-list",
      component: "Box",
      each: "scopes.root.items",
      as: "row",
      props: { expr: "({ text: scopes.row.$$value })" },
    });
    expect(container.textContent).not.toContain("the-list failed:");
    expect(container.textContent).toContain("first-item");
    expect(container.textContent).toContain("second-item");
    consoleError.mockRestore();
  });

  it("contains a broken sync seed to its element and runs the corrected seed on re-emit", async () => {
    const consoleError = silenceConsoleError();
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["seeder", "good"] },
      {
        key: "seeder",
        component: "Box",
        seed: [{ set: "scopes.root.x", expr: "document.title" }],
        props: { expr: "({ text: 'x=' + scopes.root.x })" },
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'sibling-alive' })" },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      fallbackComponents: errorSlot,
    });
    await waitFor(() => {
      expect(container.textContent).toContain("seeder failed:");
    });
    expect(container.textContent).toContain("sibling-alive");

    emit({
      key: "seeder",
      component: "Box",
      seed: [{ set: "scopes.root.x", literal: "ok" }],
      props: { expr: "({ text: 'x=' + scopes.root.x })" },
    });
    await waitFor(() => {
      expect(container.textContent).toContain("x=ok");
    });
    expect(container.textContent).not.toContain("seeder failed:");
    consoleError.mockRestore();
  });

  it("does NOT re-run a seed that succeeded when its element is re-emitted", async () => {
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["seeder"] },
      {
        key: "seeder",
        component: "Box",
        seed: [{ set: "scopes.root.x", literal: "seeded" }],
        props: { expr: "({ text: 'x=' + scopes.root.x })" },
      },
    ];
    const { container, emit, scopes } = mountEntries(lines);
    expect(container.textContent).toContain("x=seeded");

    act(() => {
      scopes.root.$$set("x", "changed");
    });
    expect(container.textContent).toContain("x=changed");

    emit({
      key: "seeder",
      component: "Box",
      seed: [{ set: "scopes.root.x", literal: "seeded" }],
      props: { expr: "({ text: 'x=' + scopes.root.x })" },
    });
    expect(container.textContent).toContain("x=changed");
  });

  it("re-emitting only a broken parent revives children it kept by reference", () => {
    const consoleError = silenceConsoleError();
    const lines: ComponentEntry[] = [
      {
        key: "foo",
        component: "Box",
        props: { expr: "({ text: document.title })" },
        children: ["bar"],
      },
      {
        key: "bar",
        component: "Box",
        props: { literal: { text: "bar-content" } },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      fallbackComponents: errorSlot,
    });
    expect(container.textContent).toContain("foo failed:");
    expect(container.textContent).not.toContain("bar-content");

    emit({
      key: "foo",
      component: "Box",
      props: { literal: { text: "foo-fixed" } },
      children: ["bar"],
    });
    expect(container.textContent).not.toContain("foo failed:");
    expect(container.textContent).toContain("foo-fixed");
    expect(container.textContent).toContain("bar-content");
    consoleError.mockRestore();
  });

  it("keeps referenced children mounted (same DOM node) when a healthy parent is re-emitted", () => {
    const lines: ComponentEntry[] = [
      {
        key: "parent",
        component: "Box",
        props: { literal: { text: "parent-v1" } },
        children: ["kid"],
      },
      {
        key: "kid",
        component: "Box",
        props: { literal: { text: "kid-content" } },
      },
    ];
    const { container, emit } = mountEntries(lines);
    const kidNodeBefore = container.querySelector('[data-key="kid"]');
    expect(kidNodeBefore).not.toBeNull();

    emit({
      key: "parent",
      component: "Box",
      props: { literal: { text: "parent-v2" } },
      children: ["kid"],
    });
    expect(container.textContent).toContain("parent-v2");
    expect(container.textContent).not.toContain("parent-v1");
    expect(container.textContent).toContain("kid-content");
    expect(container.querySelector('[data-key="kid"]')).toBe(kidNodeBefore);
  });

  it("recovers an async seed that rejected, running the corrected seed", async () => {
    const consoleError = silenceConsoleError();
    const functions: StandardToolV0[] = [
      {
        name: "failNow",
        description: "",
        execute: async () => {
          throw new Error("SEED_FAIL");
        },
      },
    ];
    const lines: ComponentEntry[] = [
      { key: "root", component: "Box", children: ["seeder", "good"] },
      {
        key: "seeder",
        component: "Box",
        seed: [{ set: "scopes.root.data", expr: "failNow()" }],
        props: { expr: "({ text: 'data=' + scopes.root.data })" },
      },
      {
        key: "good",
        component: "Box",
        props: { expr: "({ text: 'sibling-alive' })" },
      },
    ];
    const { container, emit } = mountEntries(lines, {
      functions,
      fallbackComponents: errorSlot,
    });
    await waitFor(() => {
      // The recovery prompt shows the model the host's message and the failing tool's name.
      expect(container.textContent).toContain("SEED_FAIL");
      expect(container.textContent).toContain("failNow");
    });
    expect(container.textContent).toContain("sibling-alive");

    emit({
      key: "seeder",
      component: "Box",
      seed: [{ set: "scopes.root.data", literal: "loaded" }],
      props: { expr: "({ text: 'data=' + scopes.root.data })" },
    });
    await waitFor(() => {
      expect(container.textContent).toContain("data=loaded");
    });
    expect(container.textContent).not.toContain("seeder failed:");
    consoleError.mockRestore();
  });
});

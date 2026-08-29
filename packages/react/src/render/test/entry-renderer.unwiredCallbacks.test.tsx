import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type ComponentEntry } from "@uicast/core";
import { createComponentImplementation } from "@uicast/react";
import { mountEntries } from "../../../test/render-helpers";

// Calls a handler the entry never wired, with no optional-call guard: the def
// declares it, so the implementation is entitled to call it.
const probeImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "Probe",
    description: "Calls a declared-but-unwired handler.",
    props: z.strictObject({}),
    callbacks: { onClick: z.null(), onFocus: z.null() },
  }),
  render: ({ onFocus }) => <div>{typeof onFocus}</div>,
});

const lines: ComponentEntry[] = [
  {
    key: "p",
    component: "Probe",
    callbacks: { onClick: [{ set: "scopes.root.x", literal: 1 }] },
  },
];

describe("callbacks the def declares but the entry omits", () => {
  it("are still functions, so an unguarded call cannot throw", () => {
    const errors: unknown[] = [];
    const { container } = mountEntries(lines, {
      implementations: { Probe: probeImpl },
      onError: (e: unknown) => errors.push(e),
    });
    expect(container.textContent).toBe("function");
    expect(errors).toHaveLength(0);
  });

  it("resolve without running any step", async () => {
    const calling = createComponentImplementation({
      def: createComponentDefinition({
        name: "Caller",
        description: "Invokes the unwired handler.",
        props: z.strictObject({}),
        callbacks: { onClick: z.null(), onFocus: z.null() },
      }),
      render: ({ onFocus }) => (
        <button type="button" onClick={() => onFocus()}>
          press
        </button>
      ),
    });
    const { container, scopes } = mountEntries(
      [{ key: "p", component: "Caller", callbacks: { onClick: [{ set: "scopes.root.x", literal: 1 }] } }],
      { implementations: { Caller: calling } },
    );
    container.querySelector("button")?.click();
    expect((scopes.root as unknown as { x?: unknown }).x).toBeUndefined();
  });
});

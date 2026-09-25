import { testEvaluator } from "../../../test/render-helpers";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createComponentDefinition, type EntryError } from "@uicast/core";
import { createComponentImplementation, EntriesRenderer, RendererProvider } from "@uicast/react";

const BadgeImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "Badge",
    description: "A badge",
    props: z.object({
      text: z.string(),
      variant: z.enum(["default", "loud"]).default("default"),
    }),
  }),
  render: ({ text, variant }, { entry }) => (
    <span data-key={entry.key} data-variant={variant}>
      {text}
    </span>
  ),
});

const PressImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "Press",
    description: "A button",
    props: z.object({}),
    callbacks: { onPress: z.object({ id: z.string(), times: z.number().default(1) }) },
  }),
  render: ({ onPress }, { entry }) => (
    <button type="button" data-key={entry.key} onClick={() => onPress({ id: "a" })}>
      press
    </button>
  ),
});

const BadPayloadImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "BadPayload",
    description: "A button that passes the wrong payload",
    props: z.object({}),
    callbacks: { onPress: z.object({ id: z.string() }) },
  }),
  render: ({ onPress }, { entry }) => (
    <button type="button" data-key={entry.key} onClick={() => onPress({} as never)}>
      press
    </button>
  ),
});

const NullPressImpl = createComponentImplementation({
  def: createComponentDefinition({
    name: "NullPress",
    description: "A button whose callback carries no event data",
    props: z.object({}),
    callbacks: { onPress: z.null() },
  }),
  render: ({ onPress }, { entry }) => (
    <button type="button" data-key={entry.key} onClick={() => onPress()}>
      press
    </button>
  ),
});

const impls = [BadgeImpl, PressImpl, BadPayloadImpl, NullPressImpl];

describe("EntryRenderer — schema parsing", () => {
  it("applies a schema default the entry left out", () => {
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={impls}>
        <EntriesRenderer entries={[{ key: "b", component: "Badge", props: { literal: { text: "Paid" } } }]} />
      </RendererProvider>,
    );
    expect(container.querySelector("[data-key='b']")?.getAttribute("data-variant")).toBe("default");
  });

  it("fails props the schema rejects as a document fault, before render", () => {
    const onError = vi.fn();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <RendererProvider evaluator={testEvaluator} implementations={impls} onError={onError}>
        <EntriesRenderer entries={[{ key: "b", component: "Badge", props: { literal: { variant: "loud" } } }]} />
      </RendererProvider>,
    );
    spy.mockRestore();
    expect(onError).toHaveBeenCalled();
    const err = onError.mock.calls[0][0] as EntryError;
    expect(err.reason).toBe("invalid-props");
    expect(err.fault).toBe("document");
  });

  it("drops a prop the schema does not declare instead of failing", () => {
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={impls}>
        <EntriesRenderer
          entries={[
            {
              key: "b",
              component: "Badge",
              props: { literal: { text: "Paid", colour: "red" } },
            },
          ]}
        />
      </RendererProvider>,
    );
    expect(container.textContent).toContain("Paid");
  });

  it("parses `evt` before the steps run, defaults included", async () => {
    const { container, getByText } = render(
      <RendererProvider evaluator={testEvaluator} implementations={impls}>
        <EntriesRenderer
          entries={[
            {
              key: "p",
              component: "Press",
              callbacks: { onPress: [{ set: "scopes.root.n", expr: "evt.times" }] },
            },
            {
              key: "out",
              component: "Badge",
              props: { expr: "({ text: 'n=' + scopes.root.n })" },
            },
          ]}
        />
      </RendererProvider>,
    );
    await act(async () => {
      fireEvent.click(getByText("press"));
    });
    await waitFor(() => expect(container.textContent).toContain("n=1"));
  });

  it("parses a no-arg call against a z.null() payload — evt is null, not an error", async () => {
    const onError = vi.fn();
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={impls} onError={onError}>
        <EntriesRenderer
          entries={[
            {
              key: "p",
              component: "NullPress",
              callbacks: {
                onPress: [{ set: "scopes.root.gotNull", expr: "evt === null" }],
              },
            },
            {
              key: "out",
              component: "Badge",
              props: { expr: "({ text: 'gotNull=' + scopes.root.gotNull })" },
            },
          ]}
        />
      </RendererProvider>,
    );
    await act(async () => {
      fireEvent.click(container.querySelector("[data-key='p']") as HTMLElement);
    });
    await waitFor(() => expect(container.textContent).toContain("gotNull=true"));
    expect(onError).not.toHaveBeenCalled();
  });

  it("blames the implementation for a payload its own schema rejects", async () => {
    const onError = vi.fn();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <RendererProvider evaluator={testEvaluator} implementations={impls} onError={onError}>
        <EntriesRenderer
          entries={[
            {
              key: "p",
              component: "BadPayload",
              callbacks: { onPress: [{ set: "scopes.root.n", expr: "evt.id" }] },
            },
          ]}
        />
      </RendererProvider>,
    );
    await act(async () => {
      fireEvent.click(container.querySelector("[data-key='p']") as HTMLElement);
    });
    spy.mockRestore();
    await waitFor(() => expect(onError).toHaveBeenCalled());
    const err = onError.mock.calls[0][0] as EntryError;
    expect(err.reason).toBe("implementation");
  });
});

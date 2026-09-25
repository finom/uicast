import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createComponentDefinition } from "../../create-component-definition";
import { getComponentsPartialPrompt } from "../get-components-partial-prompt";

describe("getComponentsPartialPrompt — duplicate names", () => {
  it("throws on a duplicate component name", () => {
    const A = createComponentDefinition({
      name: "Dup",
      description: "first",
      props: z.object({}),
    });
    const B = createComponentDefinition({
      name: "Dup",
      description: "second",
      props: z.object({}),
    });
    expect(() => getComponentsPartialPrompt({ definitions: [A, B] })).toThrow('Duplicate component name: "Dup"');
  });
});

describe("getComponentsPartialPrompt — hidden filter", () => {
  it("includes visible defs", () => {
    const Visible = createComponentDefinition({
      name: "Visible",
      description: "A regular LLM-visible component",
      props: z.object({}),
    });
    expect(getComponentsPartialPrompt({ definitions: [Visible] })).toContain("Visible");
  });

  it("excludes defs marked hidden: true", () => {
    const Visible = createComponentDefinition({
      name: "Visible",
      description: "advertised",
      props: z.object({}),
    });
    const Hidden = createComponentDefinition({
      name: "Hidden",
      description: "host-only",
      props: z.object({}),
      hidden: true,
    });
    const out = getComponentsPartialPrompt({ definitions: [Visible, Hidden] });
    expect(out).toContain("Visible");
    expect(out).not.toContain("Hidden");
    expect(out).not.toContain("host-only");
  });
});

describe("getComponentsPartialPrompt — common events", () => {
  const onClick = z.object({ x: z.number() }).meta({ $id: "MouseEvent", description: "fires on click" });

  it("hoists a `$id` payload once and references it per component", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({}),
      callbacks: { onClick },
    });
    const B = createComponentDefinition({
      name: "B",
      description: "b",
      props: z.object({}),
      callbacks: { onClick },
    });
    const out = getComponentsPartialPrompt({ definitions: [A, B] });

    expect(out).toContain("## Common Events");
    expect(out).toContain("- MouseEvent — fires on click");
    expect(out).toContain("onClick(evt: MouseEvent)");
    expect(out.split("- x: number").length - 1).toBe(1);
  });

  it("hoists a `$id` payload even when only one component uses it", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({}),
      callbacks: { onClick },
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).toContain("## Common Events");
    expect(out).toContain("- MouseEvent — fires on click");
    expect(out).toContain("onClick(evt: MouseEvent)");
  });

  it("inlines a callback whose payload has no `$id`", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({}),
      callbacks: {
        onDrag: z.object({ x: z.number() }).meta({ description: "fires on drag" }),
      },
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).not.toContain("## Common Events");
    expect(out).toContain("    - onDrag(evt) — fires on drag");
    expect(out).toContain("      - x: number");
  });

  it("throws when two callbacks name the same `$id` with different payloads", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({}),
      callbacks: { onX: z.object({ x: z.number() }).meta({ $id: "dup" }) },
    });
    const B = createComponentDefinition({
      name: "B",
      description: "b",
      props: z.object({}),
      callbacks: { onX: z.object({ y: z.string() }).meta({ $id: "dup" }) },
    });
    expect(() => getComponentsPartialPrompt({ definitions: [A, B] })).toThrow(/"dup" with different payloads/);
  });
});

describe("getComponentsPartialPrompt — null callback payload", () => {
  it("renders a null-payload callback as a no-arg handler", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({}),
      callbacks: { onPress: z.null() },
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).toContain("onPress()");
    expect(out).not.toContain("onPress(evt");
  });
});

describe("getComponentsPartialPrompt — descriptions on props, handlers, options", () => {
  it("surfaces the component, prop, and handler descriptions in one block", () => {
    const Counter = createComponentDefinition({
      name: "Counter",
      description: "A button that shows a number and increments it on each click.",
      props: z.strictObject({
        count: z.number().default(0).meta({ description: "The number to display" }),
      }),
      callbacks: {
        onClick: z.null().meta({ description: "Fires when the counter is pressed" }),
      },
    });
    const out = getComponentsPartialPrompt({ definitions: [Counter] });
    expect(out).toBe(
      [
        "# Available Components",
        "",
        "Counter",
        "",
        "## Component Details",
        "",
        "- Counter — A button that shows a number and increments it on each click.",
        "  Props:",
        "    - count?: number = 0 — The number to display",
        "  Event handlers:",
        "    - onClick() — Fires when the counter is pressed",
      ].join("\n"),
    );
  });

  it("lists a typed event's options, each with its description", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({}),
      callbacks: {
        onSelect: z
          .object({ id: z.string().meta({ description: "The chosen row id" }) })
          .meta({ description: "Fires on selection" }),
      },
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).toContain("    - onSelect(evt) — Fires on selection");
    expect(out).toContain("      - id: string — The chosen row id");
  });

  it("prints a schema default the way TypeScript writes one", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({
        size: z.enum(["sm", "lg"]).default("lg"),
        rows: z.array(z.string()).default([]),
        open: z.boolean().default(false).meta({ description: "Starts open" }),
      }),
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).toContain('    - size?: "sm" | "lg" = "lg"');
    expect(out).toContain("    - rows?: string[] = []");
    expect(out).toContain("    - open?: boolean = false — Starts open");
  });

  it("prints a prop's constraints in the comment, its default after the type", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({
        count: z.number().int().min(1).max(10).default(5).meta({ description: "How many" }),
      }),
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).toContain("    - count?: number /* integer, ≥ 1, ≤ 10 */ = 5 — How many");
  });

  it("leaves a description-less prop as a bare type", () => {
    const A = createComponentDefinition({
      name: "A",
      description: "a",
      props: z.object({ label: z.string() }),
    });
    const out = getComponentsPartialPrompt({ definitions: [A] });
    expect(out).toContain("    - label: string");
    expect(out).not.toContain("label: string —");
  });
  it("renders note as a trailing ## Note section", () => {
    const Stat = createComponentDefinition({
      name: "Stat",
      description: "A KPI display.",
      props: z.object({}),
    });
    const out = getComponentsPartialPrompt({
      definitions: [Stat],
      note: "Prefer Card over raw FlexCol.",
    });
    expect(out.endsWith("## Note\n\nPrefer Card over raw FlexCol.")).toBe(true);
  });
});

describe("getComponentsPartialPrompt — props that are not one object", () => {
  it("prints a union or an intersection as one type", () => {
    const Shape = createComponentDefinition({
      name: "Shape",
      description: "A shape.",
      props: z.union([
        z.object({ kind: z.literal("circle"), radius: z.number() }),
        z.object({ kind: z.literal("square"), side: z.number() }),
      ]),
    });
    const Both = createComponentDefinition({
      name: "Both",
      description: "Both.",
      props: z.object({ a: z.string() }).and(z.record(z.string(), z.number())),
    });
    const out = getComponentsPartialPrompt({ definitions: [Shape, Both] });
    expect(out).toContain(
      '- Shape — A shape.\n  Props: { kind: "circle"; radius: number } | { kind: "square"; side: number }',
    );
    expect(out).toContain("- Both — Both.\n  Props: { a: string } & { [key: string]: number }");
  });

  it("lists the fields of the object a root `$ref` names", () => {
    type Node = { name: string; kids?: Node[] };
    const node: z.ZodType<Node> = z
      .lazy(() => z.object({ name: z.string(), kids: z.array(node).optional() }))
      .meta({ id: "Node" });
    const Tree = createComponentDefinition({
      name: "Tree",
      description: "A tree.",
      props: node.meta({ description: "The root node." }),
    });
    const out = getComponentsPartialPrompt({ definitions: [Tree] });
    expect(out).toContain("  Props:\n    - name: string\n    - kids?: Node[]");
    expect(out).toContain("## Shared Types\n\n- Node: { name: string; kids?: Node[] }");
  });
});

describe("getComponentsPartialPrompt — nothing to list", () => {
  it("prints no heading without a visible definition, only the note", () => {
    const Hidden = createComponentDefinition({ name: "Hidden", description: "host-only", hidden: true });
    expect(getComponentsPartialPrompt({ definitions: [] })).toBe("");
    expect(getComponentsPartialPrompt({ definitions: [Hidden], note: "No UI here." })).toBe("## Note\n\nNo UI here.");
  });
});

describe("getComponentsPartialPrompt — URL props", () => {
  const LinkDef = createComponentDefinition({
    name: "Link",
    description: "A link",
    props: z.object({ href: z.url() }),
  });
  const TextDef = createComponentDefinition({
    name: "Text",
    description: "Text",
    props: z.object({ text: z.string() }),
  });

  it("lists what the renderer's defaults load when no policy is given", () => {
    const out = getComponentsPartialPrompt({ definitions: [LinkDef] });
    expect(out).toContain(
      "## URL Props\n\nURL-format props (`format uri`, `format uri-reference`) take only:\n" +
        "- relative URL: `/a`, `a/b`, `?q=1`, `#x`\n- absolute URL on this site\n" +
        "- `mailto:`, `tel:` or `sms:` link\n- `data:` image, not SVG\n\nOther URLs fail element.",
    );
  });

  it("follows the policy: its origin and hosts in, what it turns off out", () => {
    const out = getComponentsPartialPrompt({
      definitions: [LinkDef],
      urlPolicy: {
        allowRelative: false,
        allowDataImages: false,
        origin: "https://app.example.com",
        hosts: ["cdn.example.com", "*.img.example.com"],
      },
    });
    expect(out).toContain(
      "- absolute URL on `https://app.example.com`\n" +
        "- http or https URL on `cdn.example.com`, `*.img.example.com`\n" +
        "- `mailto:`, `tel:` or `sms:` link\n\nOther URLs fail element.",
    );
    expect(out).not.toContain("relative URL");
    expect(out).not.toContain("`data:`");
  });

  it("prints nothing for a predicate, which cannot be described", () => {
    expect(getComponentsPartialPrompt({ definitions: [LinkDef], urlPolicy: () => true })).not.toContain("## URL Props");
  });

  it("prints nothing when no listed component has a URL prop", () => {
    expect(getComponentsPartialPrompt({ definitions: [TextDef] })).not.toContain("## URL Props");
  });
});

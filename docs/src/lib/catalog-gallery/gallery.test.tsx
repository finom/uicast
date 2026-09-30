import type { ComponentEntry, EntryError, ValueSource } from "@uicast/core";
import { Evaluator } from "@uicast/expr";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import * as all from "@uicast/shadcn-catalog/all/defs";
import { impls } from "@uicast/shadcn-catalog/all/impls";
import { act, cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { EXAMPLES, GROUPS } from ".";

const DEFS = new Map(all.defs.map((def) => [def.name, def]));
const evaluator = new Evaluator();
// WCAG A and AA. Color contrast needs layout, which happy-dom does not compute.
const AXE_OPTIONS: axe.RunOptions = {
  runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  rules: { "color-contrast": { enabled: false } },
};

function expressionsOf(entry: ComponentEntry): string[] {
  const sources: (ValueSource | undefined)[] = [entry.props, ...(entry.seed ?? [])];
  for (const steps of Object.values(entry.callbacks ?? {})) sources.push(...steps);
  const exprs = sources.flatMap((source) => (source && "expr" in source ? [source.expr] : []));
  for (const field of [entry.hidden, entry.loading, entry.each]) if (typeof field === "string") exprs.push(field);
  return exprs;
}

// The prompt's structure rules, literal props against the def, declared callbacks, and every expression parsed.
function problems(entries: ComponentEntry[]): string[] {
  const out: string[] = [];
  const keys = new Set(entries.map((entry) => entry.key));
  if (keys.size !== entries.length) out.push("duplicate keys");
  const referenced = new Set<string>();
  for (const entry of entries) {
    for (const child of entry.children ?? []) {
      if (!keys.has(child)) out.push(`"${entry.key}" lists a missing child "${child}"`);
      if (referenced.has(child)) out.push(`"${child}" is listed as a child twice`);
      referenced.add(child);
    }
  }
  if (referenced.has(entries[0]?.key)) out.push("the first entry is not the root");
  if (entries.filter((entry) => !referenced.has(entry.key)).length !== 1) out.push("not exactly one root");
  for (const entry of entries) {
    const def = DEFS.get(entry.component);
    if (!def) {
      out.push(`"${entry.key}" uses an unknown component ${entry.component}`);
      continue;
    }
    if (entry.each && !entry.as) out.push(`list "${entry.key}" has no "as"`);
    if (entry.props && "literal" in entry.props) {
      const result = def.props["~standard"].validate(entry.props.literal);
      if (!(result instanceof Promise) && result.issues) {
        out.push(`"${entry.key}" props: ${result.issues.map((issue) => issue.message).join("; ")}`);
      }
    }
    for (const callback of Object.keys(entry.callbacks ?? {})) {
      if (!def.callbacks || !(callback in def.callbacks)) out.push(`"${entry.key}" has no callback ${callback}`);
    }
    for (const expr of expressionsOf(entry)) {
      try {
        evaluator.validate(expr);
      } catch (err) {
        out.push(`"${entry.key}": ${(err as Error).message}`);
      }
    }
  }
  return out;
}

// A fault of the document is the example's; an environment fault (no canvas in happy-dom) is not.
async function renderFaults(entries: ComponentEntry[]): Promise<{ document: string[]; a11y: string[] }> {
  const document: string[] = [];
  const onError = (error: EntryError) => {
    if (error.fault === "document") document.push(`"${error.elementKey}": ${error.message}`);
  };
  const { container } = render(
    <RendererProvider implementations={impls} evaluator={evaluator} onError={onError}>
      <EntriesRenderer entries={entries} />
    </RendererProvider>,
  );
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
  const { violations } = await axe.run(container, AXE_OPTIONS);
  const a11y = violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.html}`));
  cleanup();
  return { document, a11y };
}

describe.each(Object.entries(GROUPS))("%s", (_group, defs) => {
  it.each(defs.map((def) => def.name))("%s", async (name) => {
    const example = EXAMPLES[name];
    expect(example, "no example").toBeDefined();
    if (typeof example === "string") {
      const shownIn = EXAMPLES[example];
      expect(Array.isArray(shownIn), `"${example}" has no example of its own`).toBe(true);
      expect((shownIn as ComponentEntry[]).some((entry) => entry.component === name)).toBe(true);
      return;
    }
    expect(problems(example)).toEqual([]);
    const faults = await renderFaults(example);
    expect(faults.document).toEqual([]);
    // The message lists every violation; the assertion alone prints a truncated array.
    expect(faults.a11y, faults.a11y.join("\n")).toEqual([]);
  });
});

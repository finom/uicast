import type { ComponentDefinition } from "@uicast/core";
import { describe, expect, it } from "vitest";
import { defs } from "../all/defs";

// A host registers any subset of the catalog, so a description names only its own component and parts.
const FAMILIES = [
  ["Table", "TableHeader", "TableBody", "TableFooter", "TableRow", "TableHead", "TableCell"],
  ["Tabs", "TabList", "TabTrigger", "TabContent"],
  ["Accordion", "AccordionItem"],
  ["DropdownMenu", "DropdownMenuItem"],
  ["Field", "FieldLabel", "FieldDescription"],
];

const schemaOf = (spec: ComponentDefinition["props"]) =>
  spec["~standard"].jsonSchema.input({ target: "draft-2020-12" });

const descriptionsIn = (node: unknown): string[] => {
  if (!node || typeof node !== "object") return [];
  const { description } = node as { description?: unknown };
  return [...(typeof description === "string" ? [description] : []), ...Object.values(node).flatMap(descriptionsIn)];
};

const textsOf = (def: ComponentDefinition) => [
  def.description,
  ...descriptionsIn(schemaOf(def.props)),
  ...Object.values(def.callbacks ?? {}).flatMap((spec) => descriptionsIn(schemaOf(spec))),
];

describe("descriptions", () => {
  const names = defs.map((def) => def.name);

  it("every family member is a component", () => {
    expect(FAMILIES.flat().filter((name) => !names.includes(name))).toEqual([]);
  });

  it("no description names a component outside its family", () => {
    const named = defs.flatMap((def) => {
      const family = FAMILIES.find((members) => members.includes(def.name)) ?? [def.name];
      const others = names.filter((name) => !family.includes(name));
      const texts = textsOf(def);
      return others
        .filter((name) => texts.some((text) => new RegExp(`\\b${name}\\b`).test(text)))
        .map((name) => `${def.name} names ${name}`);
    });
    expect(named).toEqual([]);
  });
});

import { getComponentsPartialPrompt } from "@uicast/core/prompt";
import { entryVariants } from "../entry-variants";
import { MiniExample, type SetupPart } from "../mini-example";
import { Counter } from "./renderer";
import { CounterDef } from "./def";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import RendererMdx from "./renderer.mdx";

const ENTRY_DATA = [
  {
    key: "counter",
    component: "Counter",
    seed: [{ set: "scopes.root.count", literal: 0 }],
    props: { expr: "({ count: scopes.root.count })" },
    callbacks: {
      onClick: [{ set: "scopes.root.count", expr: "currentValue + 1" }],
    },
  },
];

const PROMPT = getComponentsPartialPrompt({ definitions: [CounterDef] });

const setup: SetupPart[] = [
  { name: "Definition", file: "def.js", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.js", prov: "you", node: <ImplMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function CounterExample() {
  return (
    <MiniExample
      entry={{ name: "Entries", prov: "llm", variants: entryVariants(ENTRY_DATA) }}
      result={<Counter />}
      setup={setup}
    />
  );
}

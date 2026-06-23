import { getComponentsPartialPrompt } from "@ui-fired/core/prompt";
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
      onClick: [{ set: "scopes.root.count", expr: "scopes.root.count + 1" }],
    },
  },
];
const ENTRY_ARRAY = JSON.stringify(ENTRY_DATA, null, 2);

const PROMPT = getComponentsPartialPrompt([CounterDef]);

const setup: SetupPart[] = [
  { name: "Definition", file: "def.js", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.js", prov: "you", node: <ImplMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function CounterExample() {
  return (
    <MiniExample
      kicker="Mini-example"
      title="Counter"
      concept="The smallest possible app: one component, one entry. A component is a pair — a definition the model reads and a React implementation that draws it — and a single JSONLines entry wires it to scopes.root.count."
      entry={{
        name: "Entries",
        prov: "llm",
        code: ENTRY_ARRAY,
        lang: "json",
      }}
      result={<Counter />}
      setup={setup}
    />
  );
}

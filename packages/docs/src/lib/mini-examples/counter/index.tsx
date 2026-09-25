import { getComponentsPartialPrompt } from "@uicast/core/prompt";
import { entriesPart } from "../entry-variants";
import { type CodePart, MiniExample } from "../mini-example";
import { Counter } from "./renderer";
import { CounterDef } from "./def";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import RendererMdx from "./renderer.mdx";
import counterEntries from "./entries.json";

const PROMPT = getComponentsPartialPrompt({ definitions: [CounterDef] });

const setup: CodePart[] = [
  { name: "Definition", file: "def.ts", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.tsx", prov: "you", node: <ImplMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function CounterExample() {
  return (
    <MiniExample
      entry={entriesPart(counterEntries)}
      result={<Counter />}
      setup={setup}
    />
  );
}

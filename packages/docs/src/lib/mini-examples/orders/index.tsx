import {
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
} from "@uicast/core/prompt";
import { entryVariants } from "../entry-variants";
import { MiniExample, type SetupPart } from "../mini-example";
import { Orders } from "./renderer";
import { ButtonDef, CardDef, HeadingDef, OrderRowDef } from "./def";
import { listOrders } from "./functions";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import FunctionsMdx from "./functions.mdx";
import ReactMdx from "./react-equivalent.mdx";
import RendererMdx from "./renderer.mdx";
import orderEntries from "./entries.json";


const PROMPT = [
  getComponentsPartialPrompt({
    definitions: [CardDef, HeadingDef, ButtonDef, OrderRowDef],
  }),
  getFunctionsPartialPrompt({ functions: [listOrders] }),
].join("\n\n");

const setup: SetupPart[] = [
  { name: "Same UI in React", file: "by hand", prov: "you", node: <ReactMdx /> },
  { name: "Definitions", file: "def.js", prov: "you", node: <DefMdx /> },
  { name: "Implementations", file: "impl.js", prov: "you", node: <ImplMdx /> },
  { name: "Function", file: "functions.js", prov: "you", node: <FunctionsMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function OrdersExample() {
  return (
    <MiniExample
      entry={{ name: "Entries", prov: "llm", variants: entryVariants(orderEntries) }}
      result={<Orders />}
      setup={setup}
    />
  );
}

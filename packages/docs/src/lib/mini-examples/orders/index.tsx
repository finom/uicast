import {
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
} from "@uicast/core/prompt";
import { ENTRY_DEFAULT_VARIANT, entryVariants } from "../entry-variants";
import { MiniExample, type SetupPart } from "../mini-example";
import { OrdersLoader } from "./loader";
import { ButtonDef, CardDef, HeadingDef, OrderRowDef } from "./def";
import { listOrders } from "./tools";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import ToolsMdx from "./tools.mdx";
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
  { name: "Same UI in React", file: "by hand", prov: "example", node: <ReactMdx /> },
  { name: "Definitions", file: "def.ts", prov: "you", node: <DefMdx /> },
  { name: "Implementations", file: "impl.tsx", prov: "you", node: <ImplMdx /> },
  { name: "Host function", file: "tools.ts", prov: "you", node: <ToolsMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function OrdersExample() {
  return (
    <MiniExample
      entry={{ name: "Entries", prov: "llm", variants: entryVariants(orderEntries), defaultVariant: ENTRY_DEFAULT_VARIANT }}
      result={<OrdersLoader />}
      setup={setup}
    />
  );
}

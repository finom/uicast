import { getComponentsPartialPrompt, getFunctionsPartialPrompt } from "@uicast/core/prompt";
import { entriesPart } from "../entry-variants";
import { type CodePart, MiniExample } from "../mini-example";
import { OrdersLoader } from "./loader";
import { ButtonDef, CardDef, EditDialogDef, HeadingDef, ProductRowDef } from "./def";
import { listProducts, updateProduct } from "./tools";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import ToolsMdx from "./tools.mdx";
import RendererMdx from "./renderer.mdx";
import orderEntries from "./entries.json";

const PROMPT = [
  getComponentsPartialPrompt({ definitions: [CardDef, HeadingDef, ButtonDef, ProductRowDef, EditDialogDef] }),
  getFunctionsPartialPrompt({ functions: [listProducts, updateProduct] }),
].join("\n\n");

const setup: CodePart[] = [
  { name: "Definitions", file: "def.ts", prov: "you", node: <DefMdx /> },
  { name: "Implementations", file: "impl.tsx", prov: "you", node: <ImplMdx /> },
  { name: "Host function", file: "tools.ts", prov: "you", node: <ToolsMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function OrdersExample() {
  return (
    <MiniExample
      entry={entriesPart(orderEntries)}
      result={<OrdersLoader />}
      setup={setup}
    />
  );
}

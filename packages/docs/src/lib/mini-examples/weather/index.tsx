import { getComponentsPartialPrompt, getFunctionsPartialPrompt } from "@uicast/core/prompt";
import { entriesPart } from "../entry-variants";
import { type CodePart, MiniExample } from "../mini-example";
import { Weather } from "./renderer";
import { WeatherCardDef } from "./def";
import { getWeather } from "./tools";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import ToolsMdx from "./tools.mdx";
import RendererMdx from "./renderer.mdx";
import weatherEntries from "./entries.json";

const PROMPT = [
  getComponentsPartialPrompt({ definitions: [WeatherCardDef] }),
  getFunctionsPartialPrompt({ functions: [getWeather] }),
].join("\n\n");

const setup: CodePart[] = [
  { name: "Definition", file: "def.ts", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.tsx", prov: "you", node: <ImplMdx /> },
  { name: "Host function", file: "tools.ts", prov: "you", node: <ToolsMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function WeatherExample() {
  return (
    <MiniExample
      entry={entriesPart(weatherEntries)}
      result={<Weather />}
      setup={setup}
    />
  );
}

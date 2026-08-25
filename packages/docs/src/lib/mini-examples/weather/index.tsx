import {
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
} from "@uicast/core/prompt";
import { MiniExample, type SetupPart } from "../mini-example";
import { Weather } from "./renderer";
import { WeatherCardDef } from "./def";
import { getWeather } from "./functions";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import FunctionsMdx from "./functions.mdx";
import RendererMdx from "./renderer.mdx";
import weatherEntries from "./entries.json";

const ENTRY_ARRAY = JSON.stringify(weatherEntries, null, 2);

const PROMPT = [
  getComponentsPartialPrompt({ definitions: [WeatherCardDef] }),
  getFunctionsPartialPrompt({ functions: [getWeather] }),
].join("\n\n");

const setup: SetupPart[] = [
  { name: "Definition", file: "def.js", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.js", prov: "you", node: <ImplMdx /> },
  { name: "Function", file: "functions.js", prov: "you", node: <FunctionsMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function WeatherExample() {
  return (
    <MiniExample
      entry={{
        name: "Entries",
        prov: "llm",
        code: ENTRY_ARRAY,
        lang: "json",
      }}
      result={<Weather />}
      setup={setup}
    />
  );
}

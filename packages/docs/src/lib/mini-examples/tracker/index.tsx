import { getComponentsPartialPrompt } from "@uicast/core/prompt";
import { MiniExample, type SetupPart } from "../mini-example";
import { Tracker } from "./renderer";
import { TrackPadDef } from "./def";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import RendererMdx from "./renderer.mdx";
import trackerEntries from "./entries.json";

const ENTRY_ARRAY = JSON.stringify(trackerEntries, null, 2);

const PROMPT = getComponentsPartialPrompt({ definitions: [TrackPadDef] });

const setup: SetupPart[] = [
  { name: "Definition", file: "def.js", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.js", prov: "you", node: <ImplMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function TrackerExample() {
  return (
    <MiniExample
      entry={{
        name: "Entries",
        prov: "llm",
        code: ENTRY_ARRAY,
        lang: "json",
      }}
      result={<Tracker />}
      setup={setup}
    />
  );
}

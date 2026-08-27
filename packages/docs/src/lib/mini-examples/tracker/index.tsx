import { getComponentsPartialPrompt } from "@uicast/core/prompt";
import { entryVariants } from "../entry-variants";
import { MiniExample, type SetupPart } from "../mini-example";
import { Tracker } from "./renderer";
import { TrackPadDef } from "./def";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import RendererMdx from "./renderer.mdx";
import trackerEntries from "./entries.json";


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
      entry={{ name: "Entries", prov: "llm", variants: entryVariants(trackerEntries) }}
      result={<Tracker />}
      setup={setup}
    />
  );
}

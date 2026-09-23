import { getComponentsPartialPrompt } from "@uicast/core/prompt";
import { ENTRY_DEFAULT_VARIANT, entryVariants } from "../entry-variants";
import { type CodePart, MiniExample } from "../mini-example";
import { Tracker } from "./renderer";
import { TrackPadDef } from "./def";
import DefMdx from "./def.mdx";
import ImplMdx from "./impl.mdx";
import RendererMdx from "./renderer.mdx";
import trackerEntries from "./entries.json";

const PROMPT = getComponentsPartialPrompt({ definitions: [TrackPadDef] });

const setup: CodePart[] = [
  { name: "Definition", file: "def.ts", prov: "you", node: <DefMdx /> },
  { name: "Implementation", file: "impl.tsx", prov: "you", node: <ImplMdx /> },
  { name: "Partial prompt", prov: "gen", code: PROMPT, lang: "md" },
  { name: "Renderer", file: "renderer.tsx", prov: "glue", node: <RendererMdx /> },
];

export function TrackerExample() {
  return (
    <MiniExample
      entry={{ name: "Entries", prov: "llm", variants: entryVariants(trackerEntries), defaultVariant: ENTRY_DEFAULT_VARIANT }}
      result={<Tracker />}
      setup={setup}
    />
  );
}

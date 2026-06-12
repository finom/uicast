import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const DiffViewerDef = createAIComponentDef({
  name: "DiffViewer",
  description:
    "A side-by-side or unified text diff viewer. Highlights additions and deletions between two text versions. Use DiffViewer for code reviews, document comparisons, version diffs, or any text comparison.",
  props: z.strictObject({
    oldText: z.string().meta({
      description: "The original/old text content",
    }),
    newText: z.string().meta({
      description: "The new/modified text content",
    }),
    oldTitle: z.string().default("Original").meta({
      description: "Title for the old text side",
    }),
    newTitle: z.string().default("Modified").meta({
      description: "Title for the new text side",
    }),
    mode: z.enum(["split", "unified"]).default("split").meta({
      description: "Display mode: split (side-by-side) or unified",
    }),
  }),
});

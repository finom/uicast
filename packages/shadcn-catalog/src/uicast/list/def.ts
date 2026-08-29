import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ListDef = createComponentDefinition({
  name: "List",
  description:
    "An ordered or unordered list for displaying items. Children are rendered as list items. Use List for displaying simple text lists, feature lists, step instructions, or any enumerated content.",
  props: z.object({
    ordered: z.boolean().default(false).meta({
      description: "Whether to render as an ordered (numbered) list",
    }),
    styleType: z.enum(["disc", "decimal", "none"]).default("disc").meta({
      description:
        "List marker style: disc (bullet), decimal (numbered), none (no markers)",
    }),
  }),
});

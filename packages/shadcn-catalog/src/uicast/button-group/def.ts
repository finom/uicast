import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ButtonGroupDef = createComponentDefinition({
  name: "ButtonGroup",
  description:
    "A horizontal group of buttons displayed together with connected borders. Children must be Button or IconButton components. Use ButtonGroup for related actions like view mode toggles, segmented controls, or action toolbars.",
  props: z.object({
    attached: z.boolean().default(true).meta({
      description:
        "Whether buttons are visually attached (shared borders) or spaced apart",
    }),
  }),
});

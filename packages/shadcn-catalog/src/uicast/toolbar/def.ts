import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ToolbarDef = createComponentDefinition({
  name: "Toolbar",
  description:
    "A horizontal action bar for toolbars above tables, editors, or content. Renders a flex container with items and optional separators. Use Toolbar for table action bars, editor toolbars, or any horizontal group of actions and controls.",
  props: z.strictObject({
    variant: z.enum(["default", "outlined"]).default("default").meta({
      description:
        "Visual variant: default (no border) or outlined (with border)",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Toolbar height/padding size",
    }),
  }),
});

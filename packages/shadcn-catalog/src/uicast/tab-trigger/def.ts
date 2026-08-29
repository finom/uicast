import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const TabTriggerDef = createComponentDefinition({
  name: "TabTrigger",
  description:
    "A single tab button inside a TabList. The 'value' prop must match the corresponding TabContent's 'value' to link them. The `text` prop is the tab label displayed on the button.",
  props: z.object({
    value: z.string().meta({
      description:
        "Unique value identifying this tab, must match the corresponding TabContent value",
    }),
    text: z
      .union([z.string(), z.number()])
      .optional()
      .meta({ description: "The tab button label text" }),
  }),
});

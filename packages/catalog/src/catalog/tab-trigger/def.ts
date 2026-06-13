import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const TabTriggerDef = createComponentDefinition({
  name: "TabTrigger",
  description:
    "A single tab button inside a TabList. The 'value' prop must match the corresponding TabContent's 'value' to link them. The children prop is the tab label text displayed on the button.",
  props: z.strictObject({
    value: z.string().meta({
      description:
        "Unique value identifying this tab, must match the corresponding TabContent value",
    }),
    children: z
      .any()
      .optional()
      .meta({ description: "The tab button label text" }),
  }),
});

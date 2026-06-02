import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const TabContentDef = createAIComponentDef({
  name: "TabContent",
  description:
    "The content panel for a specific tab. Must be placed inside a Tabs component (as a sibling to TabList). The 'value' prop must match the corresponding TabTrigger's 'value' to link them. Only the active tab's content is shown. Can contain any children components.",
  props: z.strictObject({
    value: z.string().meta({
      description:
        "Unique value identifying this tab panel, must match the corresponding TabTrigger value",
    }),
  }),
});

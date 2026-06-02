import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const TabListDef = createAIComponentDef({
  name: "TabList",
  description:
    "A horizontal bar that contains TabTrigger components. Must be placed inside a Tabs component. Renders the row of tab buttons. Children must be TabTrigger components.",
  props: z.strictObject({}),
});

import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/def/create-component-definition";

export const TabListDef = createComponentDefinition({
  name: "TabList",
  description:
    "A horizontal bar that contains TabTrigger components. Must be placed inside a Tabs component. Renders the row of tab buttons. Children must be TabTrigger components.",
  props: z.strictObject({}),
});

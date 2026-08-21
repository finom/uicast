import z from "zod";
import { createComponentDefinition } from "uicast";

export const DividerDef = createComponentDefinition({
  name: "Divider",
  description:
    "A horizontal or vertical divider line for visually separating content sections. Use Divider between card sections, form groups, or any content that needs a visual break.",
  props: z.strictObject({
    orientation: z
      .enum(["horizontal", "vertical"])
      .default("horizontal")
      .meta({ description: "Direction of the divider line" }),
  }),
});

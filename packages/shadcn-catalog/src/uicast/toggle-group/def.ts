import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const ToggleGroupDef = createComponentDefinition({
  name: "ToggleGroup",
  description:
    "A group of toggle buttons for mutually exclusive or multi-select choices. Use ToggleGroup for view switchers (grid/list), text alignment, or any set of selectable options.",
  props: z.strictObject({
    type: z.enum(["single", "multiple"]).default("single").meta({
      description:
        "Selection type: single (radio-like) or multiple (checkbox-like)",
    }),
    value: z.any().meta({
      description:
        "The current selected value (string for single, array of strings for multiple)",
    }),
    items: z
      .array(
        z.strictObject({
          value: z
            .string()
            .meta({ description: "Value identifier for this item" }),
          label: z.string().meta({ description: "Display label" }),
          icon: z.string().optional().meta({ description: "Lucide icon name" }),
        }),
      )
      .meta({ description: "Array of toggle items" }),
    variant: z.enum(["default", "outline"]).default("default").meta({
      description: "Toggle visual variant",
    }),
    size: z.enum(["default", "sm", "lg"]).default("default").meta({
      description: "Toggle button size",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the group is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.any().meta({ description: "The new selected value(s)" }),
    }),
  },
});

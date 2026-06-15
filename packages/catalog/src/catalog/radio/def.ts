import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const RadioDef = createComponentDefinition({
  name: "Radio",
  description:
    "A radio button group for selecting a single option from a list. Renders a vertical or horizontal set of radio buttons with labels. Use Radio for mutually exclusive choices like gender, plan tier, priority level, etc.",
  props: z.strictObject({
    value: z.string().optional().meta({
      description: "The currently selected option value",
    }),
    options: z
      .array(
        z.object({
          label: z
            .string()
            .meta({ description: "Display text for this option" }),
          value: z.string().meta({ description: "The value for this option" }),
        }),
      )
      .meta({ description: "Array of radio options" }),
    orientation: z
      .enum(["vertical", "horizontal"])
      .default("vertical")
      .meta({ description: "Layout direction of the radio buttons" }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the radio group is disabled",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z.string().meta({
        description: "The newly selected radio value",
      }),
    }),
  },
});

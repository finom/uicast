import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const SegmentedControlDef = createAIComponentDef({
  name: "SegmentedControl",
  description:
    "A pill-style switcher as an alternative to tabs for filters. Renders a group of segments with a sliding selection indicator. Use SegmentedControl for view filters, period selectors, or any single-select option set.",
  props: z.strictObject({
    value: z.string().meta({
      description: "The currently selected segment value",
    }),
    options: z
      .array(
        z.object({
          label: z.string().meta({ description: "Segment display text" }),
          value: z.string().meta({ description: "Segment value" }),
        }),
      )
      .meta({ description: "Array of segment options" }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the control is disabled",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Control size",
    }),
  }),
  callbacks: {
    onChange: z.strictObject({
      value: z
        .string()
        .meta({ description: "The newly selected segment value" }),
    }),
  },
});

import z from "zod";
import { createComponentDefinition } from "uicast";

export const DescriptionListDef = createComponentDefinition({
  name: "DescriptionList",
  description:
    "A label-value pair display for detail views. Renders a structured list of terms and descriptions. Use DescriptionList for profile details, order summaries, setting displays, or any key-value data presentation.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          label: z.string().meta({ description: "The term/label" }),
          value: z.string().meta({ description: "The description/value" }),
        }),
      )
      .meta({ description: "Array of label-value pairs" }),
    layout: z.enum(["vertical", "horizontal"]).default("vertical").meta({
      description: "Layout: vertical (stacked) or horizontal (side-by-side)",
    }),
    columns: z.enum(["1", "2", "3"]).default("1").meta({
      description: "Number of columns for the list",
    }),
  }),
});

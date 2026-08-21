import z from "zod";
import { createComponentDefinition } from "uicast";

export const CheckboxDef = createComponentDefinition({
  name: "Checkbox",
  description:
    "A checkbox input for boolean (true/false) values. Renders a styled square checkbox that can be checked or unchecked. Use Checkbox for toggling a setting on/off, accepting terms, or any boolean choice. For a label, place a FieldLabel next to it inside a Field component with a horizontal layout.",
  props: z.strictObject({
    checked: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the checkbox is checked" }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the checkbox is disabled" }),
    label: z
      .string()
      .optional()
      .meta({ description: "Optional inline label text next to the checkbox" }),
  }),
  callbacks: {
    onChange: z.strictObject({
      checked: z.boolean().meta({ description: "The new checked state" }),
    }),
  },
});

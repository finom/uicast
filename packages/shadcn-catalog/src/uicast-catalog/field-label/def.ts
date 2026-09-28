import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const FieldLabelDef = createComponentDefinition({
  name: "FieldLabel",
  description:
    "A form field label. Must be placed inside a Field component, before the input. Renders a styled label element.",
  props: z.strictObject({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The label text" }),
  }),
});

import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const LabelDef = createComponentDefinition({
  name: "Label",
  description:
    "A standalone text label for annotating UI elements. Renders a styled label element. Use Label for any short descriptive text next to form controls, stats, or indicators. For form field labels specifically, prefer FieldLabel inside a Field component.",
  props: z.object({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The label text" }),
    htmlFor: z.string().optional().meta({
      description: "The ID of the form element this label is associated with",
    }),
  }),
});

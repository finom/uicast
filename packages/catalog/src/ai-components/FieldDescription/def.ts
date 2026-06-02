import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const FieldDescriptionDef = createAIComponentDef({
  name: "FieldDescription",
  description:
    "A helper/description text for a form field. Must be placed inside a Field component, after the input element. Renders small muted text below the input. Use FieldDescription to provide additional context, validation hints, or instructions for a form field.",
  props: z.strictObject({
    children: z
      .any()
      .optional()
      .meta({ description: "The description/helper text" }),
  }),
});

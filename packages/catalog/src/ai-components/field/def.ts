import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const FieldDef = createAIComponentDef({
  name: "Field",
  description:
    "A form field wrapper that groups a FieldLabel, an input component (Input, Select, DatePicker, Checkbox, NumberInput, etc.), and an optional FieldDescription together. Children should be FieldLabel, then the input, then optionally FieldDescription. Provides consistent spacing and layout for form fields.",
  props: z.strictObject({
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the entire field group is disabled" }),
  }),
});

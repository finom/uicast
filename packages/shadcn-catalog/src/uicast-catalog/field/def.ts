import { createComponentDefinition } from "@uicast/core";

export const FieldDef = createComponentDefinition({
  name: "Field",
  description:
    "A form field wrapper that groups a FieldLabel, an input, and an optional FieldDescription together. Children should be FieldLabel, then the input, then optionally FieldDescription. Provides consistent spacing and layout for form fields.",
});

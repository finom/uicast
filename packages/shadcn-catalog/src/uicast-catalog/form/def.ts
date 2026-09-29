import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const FormDef = createComponentDefinition({
  name: "Form",
  description:
    "A form: its children are the fields, each in a Field, and it draws its own submit button after them. On submit the browser checks every field against its own rules (`required`, an email or URL `type`, `min`/`max`); each failing field shows its message and the first one gets focus. `onSubmit` runs only when all pass, and the button shows a spinner until its steps finish. Mark each field a user must fill `required`. Don't add another submit button, and don't compute a button's `disabled` from field values.",
  props: z.strictObject({
    submitText: z.string().default("Submit").meta({ description: "The submit button's label" }),
  }),
  callbacks: {
    onSubmit: z.null().meta({ description: "Runs when every field passes its checks" }),
  },
});

import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyboardEventSchema } from "../../events/keyboard";

export const TextareaDef = createComponentDefinition({
  name: "Textarea",
  description:
    "A multi-line text input field for longer text content such as comments, descriptions, or messages. Renders a styled textarea element. Use Textarea for multi-line form fields. For labels and descriptions, wrap with Field, FieldLabel, and FieldDescription components. For single-line input, use Input instead.",
  props: z.object({
    value: z.any().meta({ description: "The current textarea value" }),
    placeholder: z.string().optional().meta({
      description: "Placeholder text shown when the textarea is empty",
    }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the textarea is disabled" }),
    rows: z
      .number()
      .default(3)
      .meta({ description: "The number of visible text lines" }),
  }),
  callbacks: {
    onKeyDown: keyboardEventSchema,
    onKeyUp: keyboardEventSchema,
    onChange: z.object({
      value: z
        .string()
        .meta({ description: "The current string value of the textarea" }),
    }),
    onFocus: z.null(),
    onBlur: z.object({
      value: z.string().meta({
        description: "The current string value of the textarea on blur",
      }),
    }),
  },
});

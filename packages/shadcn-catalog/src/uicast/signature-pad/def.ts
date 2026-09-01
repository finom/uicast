import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SignaturePadDef = createComponentDefinition({
  name: "SignaturePad",
  description:
    "A signature capture pad for approvals and contracts. Renders a canvas area for drawing signatures with a clear button. Use SignaturePad for digital signature capture, approval workflows, or contract signing.",
  props: z.strictObject({
    width: z.number().default(400).meta({
      description: "Canvas width in pixels",
    }),
    height: z.number().default(200).meta({
      description: "Canvas height in pixels",
    }),
    penColor: z.string().default("#000000").meta({
      description: "Pen color for the signature",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the pad is disabled",
    }),
    label: z.string().optional().meta({
      description: "Optional label text above the pad (e.g. 'Sign here')",
    }),
  }),
  callbacks: {
    onEnd: z.strictObject({
      isEmpty: z
        .boolean()
        .meta({ description: "Whether the signature pad is empty" }),
    }),
    onClear: z.null().meta({
      description: "Callback when the signature is cleared",
    }),
  },
});

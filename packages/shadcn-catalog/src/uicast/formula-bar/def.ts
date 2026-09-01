import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const FormulaBarDef = createComponentDefinition({
  name: "FormulaBar",
  description:
    "A formula/expression input with cell reference support, similar to spreadsheet formula bar. Renders an input with a formula icon. Use FormulaBar for spreadsheet-like apps, calculated fields, or expression editors.",
  props: z.strictObject({
    value: z.string().default("").meta({
      description: "Current formula value",
    }),
    placeholder: z.string().default("Enter formula (e.g. =SUM(A1:A10))").meta({
      description: "Placeholder text",
    }),
    cellReference: z.string().optional().meta({
      description: "Current cell reference display (e.g. 'A1')",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the input is disabled",
    }),
  }),
  callbacks: {
    onChange: z
      .object({
        value: z.string().meta({ description: "The new formula value" }),
      })
      .meta({ description: "Callback when formula changes" }),
    onSubmit: z
      .object({
        value: z.string().meta({ description: "The submitted formula" }),
      })
      .meta({
        description: "Callback when formula is submitted (Enter pressed)",
      }),
  },
});

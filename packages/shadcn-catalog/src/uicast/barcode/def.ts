import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const BarcodeDef = createComponentDefinition({
  name: "Barcode",
  description:
    "A stylized barcode-look graphic. Renders an illustrative bar pattern derived from the value — decorative only, not a scannable barcode. Use Barcode for product label mockups, shipping label previews, inventory-style visuals, etc.",
  props: z.object({
    value: z.string().meta({
      description: "The value the bar pattern is derived from",
    }),
    height: z.number().default(100).meta({
      description: "Barcode height in pixels",
    }),
    showText: z.boolean().default(true).meta({
      description: "Whether to show the value as text below the bars",
    }),
  }),
});

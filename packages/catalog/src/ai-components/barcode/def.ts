import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const BarcodeDef = createAIComponentDef({
  name: "Barcode",
  description:
    "A barcode generation component for inventory, shipping, and product identification. Renders a barcode image from a given value. Use Barcode for product labels, shipping labels, inventory tracking, etc.",
  props: z.strictObject({
    value: z.string().meta({
      description: "The content to encode as a barcode",
    }),
    format: z
      .enum(["CODE128", "CODE39", "EAN13", "EAN8", "UPC"])
      .default("CODE128")
      .meta({
        description: "Barcode format type",
      }),
    width: z.number().default(2).meta({
      description: "Width of each bar",
    }),
    height: z.number().default(100).meta({
      description: "Barcode height in pixels",
    }),
    showText: z.boolean().default(true).meta({
      description:
        "Whether to show the encoded value as text below the barcode",
    }),
  }),
});

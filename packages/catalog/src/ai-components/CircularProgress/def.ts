import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const CircularProgressDef = createAIComponentDef({
  name: "CircularProgress",
  description:
    "A circular/ring progress indicator with percentage. Renders a circular progress ring. Use CircularProgress for loading states with known percentage, skill levels, completion rates, or upload progress.",
  props: z.strictObject({
    value: z.number().default(0).meta({
      description: "Progress value (0-100)",
    }),
    size: z.number().default(80).meta({
      description: "Circle diameter in pixels",
    }),
    strokeWidth: z.number().default(8).meta({
      description: "Width of the progress ring",
    }),
    color: z.string().default("hsl(var(--primary))").meta({
      description: "Progress ring color",
    }),
    showValue: z.boolean().default(true).meta({
      description: "Whether to show the percentage text in center",
    }),
    label: z.string().optional().meta({
      description: "Optional label beneath the progress ring",
    }),
  }),
});

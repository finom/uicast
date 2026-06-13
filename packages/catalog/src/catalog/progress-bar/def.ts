import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const ProgressBarDef = createComponentDefinition({
  name: "ProgressBar",
  description:
    "A horizontal progress bar indicating completion or loading progress. Displays a filled bar within a track. Use ProgressBar for file upload progress, task completion, loading indicators, or any percentage-based metric.",
  props: z.strictObject({
    value: z.number().default(0).meta({
      description: "Current progress value (0-100)",
    }),
    max: z.number().default(100).meta({
      description: "Maximum value (default 100)",
    }),
    showLabel: z.boolean().default(false).meta({
      description: "Whether to show the percentage text above the bar",
    }),
    color: z
      .enum(["default", "success", "warning", "error"])
      .default("default")
      .meta({
        description:
          "Color variant: default (primary), success (green), warning (yellow), error (red)",
      }),
    size: z.enum(["sm", "md", "lg"]).default("md").meta({
      description: "Bar height: sm (4px), md (8px), lg (12px)",
    }),
  }),
});

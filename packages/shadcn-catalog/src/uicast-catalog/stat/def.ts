import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const StatDef = createComponentDefinition({
  name: "Stat",
  description:
    "A statistics display component showing a label, a large number value, and an optional trend indicator. Use Stat for KPI cards, dashboard metrics, or any numeric summary (e.g. total revenue, user count, conversion rate).",
  props: z.strictObject({
    label: z.string().meta({ description: "The metric label, e.g. 'Total Revenue'" }),
    value: z.union([z.string(), z.number()]).meta({
      description: "The primary display value, already formatted. Rendered large.",
    }),
    trend: z.enum(["up", "down", "neutral"]).optional().meta({
      description:
        "Optional trend arrow direction: up (green, positive), down (red, negative), neutral (gray, no change)",
    }),
    trendValue: z.string().optional().meta({
      description: "Optional trend text, e.g. '+12%' or '-3.2%'",
    }),
    helpText: z.string().optional().meta({
      description: "Optional helper text below the value, e.g. 'vs. last month'",
    }),
  }),
});

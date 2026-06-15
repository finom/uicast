import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const CronBuilderDef = createComponentDefinition({
  name: "CronBuilder",
  description:
    "A visual cron expression builder. Provides dropdowns to construct cron expressions without memorizing syntax. Use CronBuilder for scheduling tasks, setting up recurring events, or configuring automated jobs.",
  props: z.strictObject({
    value: z.string().default("* * * * *").meta({
      description:
        "Current cron expression (5-part: minute hour day month weekday)",
    }),
    showPreview: z.boolean().default(true).meta({
      description: "Whether to show a human-readable preview of the expression",
    }),
  }),
  callbacks: {
    onChange: z
      .object({
        value: z.string().meta({ description: "The new cron expression" }),
      })
      .meta({ description: "Callback when cron expression changes" }),
  },
});

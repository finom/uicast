import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/createAIComponentDef";

export const TimelineDef = createAIComponentDef({
  name: "Timeline",
  description:
    "A chronological event display for activity logs, history, and progress tracking. Renders a vertical timeline with events. Use Timeline for activity feeds, order histories, deployment logs, or any sequential events.",
  props: z.strictObject({
    items: z
      .array(
        z.object({
          title: z.string().meta({ description: "Event title" }),
          description: z
            .string()
            .optional()
            .meta({ description: "Event description" }),
          time: z.string().optional().meta({
            description: "Timestamp text (e.g. '2 hours ago', 'Jan 15')",
          }),
          icon: z
            .string()
            .optional()
            .meta({ description: "Lucide icon name for the event" }),
          variant: z
            .enum(["default", "success", "warning", "destructive"])
            .optional()
            .meta({
              description: "Color variant for the event dot",
            }),
        }),
      )
      .meta({ description: "Array of timeline events in chronological order" }),
  }),
  callbacks: {
    onItemClick: z
      .object({
        index: z
          .number()
          .meta({ description: "The index of the clicked item" }),
        title: z
          .string()
          .meta({ description: "The title of the clicked item" }),
      })
      .meta({ description: "Callback when a timeline item is clicked" }),
  },
});

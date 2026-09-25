import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { iconNameSchema } from "../../lib/icons";

export const TimelineDef = createComponentDefinition({
  name: "Timeline",
  description:
    "A chronological event display for activity logs, history, and progress tracking. Renders a vertical timeline with events. Use Timeline for activity feeds, order histories, deployment logs, or any sequential events.",
  props: z.strictObject({
    items: z
      .array(
        z.strictObject({
          title: z.string().meta({ description: "Event title" }),
          description: z.string().optional().meta({ description: "Event description" }),
          time: z.string().optional().meta({
            description: "Timestamp text (e.g. '2 hours ago', 'Jan 15')",
          }),
          icon: iconNameSchema.optional().meta({ description: "Optional icon for the event." }),
          variant: z.enum(["default", "success", "warning", "destructive"]).optional().meta({
            description: "Color variant for the event dot",
          }),
        }),
      )
      .meta({ description: "Array of timeline events in chronological order" }),
  }),
  callbacks: {
    onItemClick: z
      .strictObject({
        index: z.number().int().nonnegative().meta({ description: "The index of the clicked item" }),
        title: z.string().meta({ description: "The title of the clicked item" }),
      })
      .meta({ description: "Callback when a timeline item is clicked" }),
  },
});

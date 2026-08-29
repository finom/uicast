import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const RatingDef = createComponentDefinition({
  name: "Rating",
  description:
    "A star/icon-based rating input. Renders clickable star icons for rating. Use Rating for product reviews, feedback forms, satisfaction surveys, or any star rating.",
  props: z.object({
    value: z.number().default(0).meta({
      description: "The current rating value",
    }),
    max: z.number().default(5).meta({
      description: "Maximum number of stars",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Star icon size",
    }),
    disabled: z.boolean().default(false).meta({
      description: "Whether the rating is read-only/disabled",
    }),
  }),
  callbacks: {
    onChange: z.object({
      value: z.number().meta({ description: "The new rating value" }),
    }),
  },
});

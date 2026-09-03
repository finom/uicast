import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const RatingDef = createComponentDefinition({
  name: "Rating",
  description:
    "A star/icon-based rating input. Renders clickable star icons for rating. Use Rating for product reviews, feedback forms, satisfaction surveys, or any star rating.",
  props: z.strictObject({
    value: z.number().nonnegative().default(0).meta({
      description: "The current rating value",
    }),
    max: z.number().int().min(1).default(5).meta({
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
    onChange: z.strictObject({
      value: z.number().nonnegative().meta({ description: "The new rating value" }),
    }),
  },
});

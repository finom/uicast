import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SkeletonDef = createComponentDefinition({
  name: "Skeleton",
  description:
    "A loading placeholder that shows a pulsing animation where content will appear. Use Skeleton to indicate content is loading. Renders a rounded rectangle of configurable width and height.",
  props: z.strictObject({
    width: z.string().default("100%").meta({
      description: "CSS width value, e.g. '100%', '200px', '12rem'",
    }),
    height: z.string().default("1.25rem").meta({
      description: "CSS height value, e.g. '1.25rem', '40px', '100px'",
    }),
    rounded: z
      .enum(["sm", "md", "lg", "full"])
      .default("md")
      .meta({ description: "Border radius: sm, md, lg, or full (circle)" }),
  }),
});

import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { heightSchema, widthSchema } from "../../lib/sizes";

export const SkeletonDef = createComponentDefinition({
  name: "Skeleton",
  description:
    "A loading placeholder that shows a pulsing animation where content will appear. Use Skeleton to indicate content is loading. Renders a rounded rectangle of configurable width and height.",
  props: z.strictObject({
    width: widthSchema.default("full").meta({ description: "Placeholder width." }),
    height: heightSchema.default("xs").meta({ description: "Placeholder height." }),
    rounded: z
      .enum(["sm", "md", "lg", "full"])
      .default("md")
      .meta({ description: "Border radius: sm, md, lg, or full (circle)" }),
  }),
});

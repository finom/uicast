import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const ContainerDef = createAIComponentDef({
  name: "Container",
  description:
    "A max-width centered content wrapper. Constrains content to a readable width with automatic horizontal centering. Use Container for page-level content sections, centered layouts, or constraining wide content.",
  props: z.strictObject({
    maxWidth: z
      .enum(["sm", "md", "lg", "xl", "2xl", "full"])
      .default("lg")
      .meta({
        description:
          "Maximum width: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px), full (100%)",
      }),
    padding: z.enum(["none", "sm", "default", "lg"]).default("default").meta({
      description: "Horizontal padding inside the container",
    }),
  }),
});

import z from "zod";
import { createComponentDefinition } from "@ui-fired/core";

export const ContainerDef = createComponentDefinition({
  name: "Container",
  description:
    "A max-width centered content wrapper. Constrains content to a readable width with automatic horizontal centering, and stacks its children vertically with a configurable gap. Use Container for page-level content sections, centered layouts, or constraining wide content.",
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
    gap: z.enum(["0", "1", "2", "3", "4", "6", "8"]).default("6").meta({
      description:
        "Vertical gap between child sections using Tailwind spacing scale (0-8)",
    }),
  }),
});

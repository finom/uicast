import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SpacerDef = createComponentDefinition({
  name: "Spacer",
  description:
    "An empty spacer element for adding fixed whitespace between components. Use Spacer to add vertical or horizontal space between siblings. For flexible spacing, consider using FlexRow/FlexCol with justify='between' instead.",
  props: z.strictObject({
    size: z.enum(["1", "2", "3", "4", "6", "8", "12", "16"]).default("4").meta({
      description:
        "The space size using Tailwind spacing scale. Maps to 0.25rem increments (4 = 1rem, 8 = 2rem, etc.)",
    }),
    direction: z.enum(["vertical", "horizontal"]).default("vertical").meta({
      description:
        "Direction of the space: vertical adds height, horizontal adds width",
    }),
  }),
});

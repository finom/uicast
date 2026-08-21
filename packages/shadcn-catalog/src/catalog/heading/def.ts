import z from "zod";
import { createComponentDefinition } from "uicast";

export const HeadingDef = createComponentDefinition({
  name: "Heading",
  description:
    "A heading component for displaying titles and section headers. Renders h1-h6 HTML heading tags. Use Heading for page titles, section titles, and any prominent text that defines content hierarchy.",
  props: z.strictObject({
    level: z.enum(["1", "2", "3", "4", "5", "6"]).default("2").meta({
      description: "The heading level (1-6), maps to h1-h6 HTML tags",
    }),
    children: z
      .any()
      .optional()
      .meta({ description: "The heading text content" }),
  }),
});

import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";
import { onClickSchema } from "@ui-fired/catalog/render/shared";

export const CardDef = createComponentDefinition({
  name: "Card",
  description:
    "A container component with rounded corners, shadow, and border for grouping related content. Can contain any children components. Optionally displays a title and description in a header area. Use Card to visually group related UI elements such as forms, stats, or content sections.",
  props: z.strictObject({
    title: z
      .string()
      .optional()
      .meta({ description: "Optional header title text" }),
    description: z
      .string()
      .optional()
      .meta({ description: "Optional description text shown below the title" }),
  }),
  callbacks: {
    onClick: onClickSchema,
  },
});

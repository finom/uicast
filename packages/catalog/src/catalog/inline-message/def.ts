import z from "zod";
import { createComponentDefinition } from "@ui-fired/core/render/create-component-definition";

export const InlineMessageDef = createComponentDefinition({
  name: "InlineMessage",
  description:
    "An inline contextual message for form fields or sections. Renders a small styled message with an icon. Use InlineMessage for field validation hints, warnings, or info messages within forms.",
  props: z.strictObject({
    variant: z
      .enum(["info", "success", "warning", "error"])
      .default("info")
      .meta({
        description: "Message variant determining icon and color",
      }),
    message: z.string().meta({
      description: "Message text",
    }),
  }),
});

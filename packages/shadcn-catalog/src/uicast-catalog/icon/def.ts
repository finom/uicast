import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { iconNameSchema } from "../../lib/icons";

export const IconDef = createComponentDefinition({
  name: "Icon",
  description:
    "A single icon. Use it inside a Button, a table cell, or beside text. For a clickable icon, use IconButton.",
  props: z.strictObject({
    name: iconNameSchema.meta({
      description: "Which icon to render.",
    }),
    size: z.enum(["sm", "md", "lg", "xl"]).default("md").meta({
      description: "Icon size: sm (16px), md (20px), lg (24px), xl (32px)",
    }),
    color: z
      .enum(["default", "muted", "primary", "destructive", "success", "warning"])
      .default("default")
      .meta({ description: "Which theme colour to draw the icon in." }),
  }),
});

import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";
import { iconNameSchema } from "../../lib/icons";

export const ButtonDef = createComponentDefinition({
  name: "Button",
  description:
    "A clickable button for triggering actions: form submissions, toolbar actions, close buttons, toggles. It shows `text`, an `icon`, or both; set at least one. With only an icon it is square, and `tooltip` names it.",
  props: z.strictObject({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The button label text" }),
    icon: iconNameSchema.optional().meta({ description: "An icon before the text, or alone" }),
    variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).default("default").meta({
      description:
        "Visual variant: default (primary filled), destructive (red), outline (bordered), secondary (gray), ghost (transparent), link (underlined text)",
    }),
    size: z.enum(["sm", "default", "lg"]).default("default").meta({
      description: "Button size. Sets the height, the text size and the icon size together.",
    }),
    disabled: z.boolean().default(false).meta({ description: "Whether the button is disabled" }),
    tooltip: z.string().optional().meta({ description: "Text shown on hover" }),
  }),
  callbacks: {
    onClick: mouseEventSchema,
  },
});

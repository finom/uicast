import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";

export const ButtonDef = createComponentDefinition({
  name: "Button",
  description:
    "A clickable button for triggering actions. Supports multiple visual variants and sizes. Use Button for form submissions, actions, navigation triggers, or any interactive click target. The `text` prop sets the button label.",
  props: z.object({
    text: z.union([z.string(), z.number()]).optional().meta({ description: "The button label text" }),
    variant: z
      .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
      .default("default")
      .meta({
        description:
          "Visual variant: default (primary filled), destructive (red), outline (bordered), secondary (gray), ghost (transparent), link (underlined text)",
      }),
    size: z.enum(["default", "sm", "lg", "icon"]).default("default").meta({
      description:
        "Button size: default, sm (small), lg (large), icon (square icon button)",
    }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the button is disabled" }),
  }),
  callbacks: {
    onClick: mouseEventSchema,
  },
});

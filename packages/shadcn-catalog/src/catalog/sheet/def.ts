import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const SheetDef = createComponentDefinition({
  name: "Sheet",
  description:
    "A slide-in panel from the screen edge. Similar to Drawer but using the Sheet primitive directly. Use Sheet for mobile navigation menus, filter panels, or side content that slides in from any edge.",
  props: z.strictObject({
    open: z.boolean().default(false).meta({
      description: "Whether the sheet is open/visible",
    }),
    title: z.string().optional().meta({
      description: "Optional sheet header title",
    }),
    description: z.string().optional().meta({
      description: "Optional description text below the title",
    }),
    side: z.enum(["top", "bottom", "left", "right"]).default("right").meta({
      description: "Which edge the sheet slides in from",
    }),
  }),
  callbacks: {
    onOpenChange: z
      .object({
        open: z.boolean().meta({
          description: "The new open state",
        }),
      })
      .meta({ description: "Callback when the sheet open state changes" }),
  },
});

import z from "zod";
import { createAIComponentDef } from "ui-fired/core/render/createAIComponentDef";

export const DrawerDef = createAIComponentDef({
  name: "Drawer",
  description:
    "A slide-out panel that appears from the edge of the screen. Controlled by the 'open' prop. Contains a title, optional description, and any children components. Use Drawer for side navigation, detail panels, forms, or filters. Similar to Modal but slides in from the side rather than appearing centered.",
  props: z.strictObject({
    open: z.boolean().default(false).meta({
      description: "Whether the drawer is open/visible",
    }),
    title: z.string().optional().meta({
      description: "The drawer header title",
    }),
    description: z.string().optional().meta({
      description: "Optional description text below the title",
    }),
    side: z.enum(["left", "right"]).default("right").meta({
      description: "Which side the drawer slides in from",
    }),
  }),
  callbacks: {
    onOpenChange: z
      .object({
        open: z.boolean().meta({
          description: "The new open state (typically false when closing)",
        }),
      })
      .meta({
        description: "Callback when the drawer open state changes",
      }),
  },
});

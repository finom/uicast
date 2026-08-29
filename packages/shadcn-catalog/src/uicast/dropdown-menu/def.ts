import z from "zod";
import { createComponentDefinition } from "@uicast/core";

export const DropdownMenuDef = createComponentDefinition({
  name: "DropdownMenu",
  description:
    "A dropdown menu triggered by a button click. Renders a trigger button and a popover menu. Children must be DropdownMenuItem components. Use DropdownMenu for action menus, context menus, or any set of actions behind a '...' or similar trigger button.",
  props: z.object({
    triggerLabel: z.string().optional().meta({
      description:
        "Label text for the trigger button. If omitted, renders a '...' icon button",
    }),
  }),
});

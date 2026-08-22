import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { mouseEventSchema } from "../../events/mouse";

export const DropdownMenuItemDef = createComponentDefinition({
  name: "DropdownMenuItem",
  description:
    "A single item/action inside a DropdownMenu. Must be a child of DropdownMenu. Use DropdownMenuItem for each action option in the dropdown (Edit, Delete, View, etc.).",
  props: z.strictObject({
    children: z
      .any()
      .optional()
      .meta({ description: "The menu item label text" }),
    variant: z.enum(["default", "destructive"]).default("default").meta({
      description:
        "Visual variant: default or destructive (red, for dangerous actions like Delete)",
    }),
    disabled: z
      .boolean()
      .default(false)
      .meta({ description: "Whether the menu item is disabled" }),
  }),
  callbacks: {
    onClick: mouseEventSchema,
  },
});

import z from "zod";
import { createAIComponentDef } from "@ui-fired/core/render/create-ai-component-def";

export const KBDDef = createAIComponentDef({
  name: "KBD",
  description:
    "A keyboard shortcut display component. Renders keyboard keys in a styled inline format. Use KBD for documenting shortcuts, command references, or displaying key combinations.",
  props: z.strictObject({
    keys: z.array(z.string()).meta({
      description:
        "Array of key labels (e.g. ['⌘', 'K'] or ['Ctrl', 'Shift', 'P'])",
    }),
  }),
});

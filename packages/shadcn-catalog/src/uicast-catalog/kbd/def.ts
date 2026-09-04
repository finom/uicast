import z from "zod";
import { createComponentDefinition } from "@uicast/core";
import { keyNameSchema } from "../../lib/keys";

export const KBDDef = createComponentDefinition({
  name: "KBD",
  description:
    "A keyboard shortcut display component. Renders keyboard keys in a styled inline format. Use KBD for documenting shortcuts, command references, or displaying key combinations.",
  props: z.strictObject({
    keys: z.array(keyNameSchema).min(1).meta({
      description: "The keys in the chord, in order.",
    }),
  }),
});

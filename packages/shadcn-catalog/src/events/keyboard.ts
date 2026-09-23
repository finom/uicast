import z from "zod";
import type { KeyboardEvent } from "react";

export const keyboardEventSchema = z
  .object({
    key: z.string().meta({
      description: 'The key value (e.g. "Enter", "a", "ArrowUp")',
    }),
    code: z.string().meta({
      description: 'The physical key code (e.g. "Enter", "KeyA")',
    }),
    altKey: z.boolean().meta({ description: "Whether Alt was held" }),
    ctrlKey: z.boolean().meta({ description: "Whether Control was held" }),
    metaKey: z
      .boolean()
      .meta({ description: "Whether Meta (Cmd/Win) was held" }),
    shiftKey: z.boolean().meta({ description: "Whether Shift was held" }),
    repeat: z.boolean().meta({
      description: "Whether the key is auto-repeating from being held down",
    }),
  })
  .meta({
    $id: "KeyboardEvent",
    description: "Callback for a keyboard key event (keydown / keyup)",
  });

export function pickKeyboardEvent(e: KeyboardEvent) {
  return {
    key: e.key,
    code: e.code,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    repeat: e.repeat,
  };
}

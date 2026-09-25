import type { KeyboardEvent } from "react";
import z from "zod";

/**
 * The payload of a key callback: `key`, `code`, the modifier flags and `repeat`. Its `$id`, `KeyboardEvent`, prints it
 * once in the prompt, under `## Common Events`.
 *
 * @example
 * createComponentDefinition({
 *   name: "Search",
 *   description: "A search box.",
 *   callbacks: { onKeyDown: keyboardEventSchema }, // printed as onKeyDown(evt: KeyboardEvent)
 * });
 */
export const keyboardEventSchema = z
  .object({
    key: z.string().meta({ description: 'The key value (e.g. "Enter", "a", "ArrowUp")' }),
    code: z.string().meta({ description: 'The physical key code (e.g. "Enter", "KeyA")' }),
    altKey: z.boolean().meta({ description: "Whether Alt was held" }),
    ctrlKey: z.boolean().meta({ description: "Whether Control was held" }),
    metaKey: z.boolean().meta({ description: "Whether Meta (Cmd/Win) was held" }),
    shiftKey: z.boolean().meta({ description: "Whether Shift was held" }),
    repeat: z.boolean().meta({ description: "Whether the key is auto-repeating from being held down" }),
  })
  .meta({ $id: "KeyboardEvent", description: "Callback for a keyboard key event (keydown / keyup)" });

export const pickKeyboardEvent = ({ key, code, altKey, ctrlKey, metaKey, shiftKey, repeat }: KeyboardEvent) => ({
  key,
  code,
  altKey,
  ctrlKey,
  metaKey,
  shiftKey,
  repeat,
});

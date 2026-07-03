import { keyboardEventSchema, pickKeyboardEvent } from "./keyboard";
import { mouseEventSchema, pickMouseEvent } from "./mouse";

export { keyboardEventSchema, pickKeyboardEvent, mouseEventSchema, pickMouseEvent };

// The canonical list for getComponentsPartialPrompt's `commonEvents` — every
// shared event schema joins it so callers never assemble the set by hand.
export const allCommonEventSchemas = [mouseEventSchema, keyboardEventSchema];

import { keyboardEventSchema } from "./keyboard";
import { mouseEventSchema } from "./mouse";

// The catalog's public event surface is this list and nothing else: it exists
// to be handed to `getComponentsPartialPrompt({ commonEvents })`, so the
// handlers the catalog's components fire print once. The individual schemas and
// their `pick*` helpers stay internal — the catalog is a plug-and-play
// component set, not a toolkit to build components against. Writing your own
// components means writing your own event schemas.
export const allCommonEventSchemas = [mouseEventSchema, keyboardEventSchema];

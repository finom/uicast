import { ALLOWED_GLOBALS } from "@uicast/expr/internal";

// The engine's own globals, by name from the allow-list. Nothing else resolves.
export const PLATFORM_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze(
	Object.fromEntries(ALLOWED_GLOBALS.map((name) => [name, (globalThis as Record<string, unknown>)[name]])),
);

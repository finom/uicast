import { ALLOWED_GLOBALS } from "@uicast/expr/internal";

export const PLATFORM_GLOBALS: Readonly<Record<string, unknown>> = Object.freeze(
	Object.fromEntries(ALLOWED_GLOBALS.map((name) => [name, (globalThis as Record<string, unknown>)[name]])),
);

import type { ComponentDefinition } from "./create-component-definition";

/**
 * Validate a component-def registry: an array of self-describing defs, each
 * carrying its own `name`. Throws on a duplicate `name` — the array form
 * loses the compile-time uniqueness the old keyed-object registry gave for
 * free, so we restore it as a fail-fast check at import time. Returns the
 * same array unchanged.
 *
 * Prompt assembly lives in `getComponentsPartialPrompt`
 * (`../prompt/getComponentsPartialPrompt`), not here.
 */
export const createComponentDefinitions = (
	defs: ComponentDefinition[],
): ComponentDefinition[] => {
	const seen = new Set<string>();
	for (const def of defs) {
		if (seen.has(def.name)) {
			throw new Error(`Duplicate component name: "${def.name}"`);
		}
		seen.add(def.name);
	}
	return defs;
};

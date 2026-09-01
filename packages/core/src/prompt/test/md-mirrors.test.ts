import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The .md prompt fragments ship through generated .json mirrors, and nothing
// fails loudly when a mirror goes stale — this does.
describe("prompt md mirrors", () => {
	it.each(["INSTRUCTIONS"])(
		"%s.json mirrors the .md source",
		(name) => {
			const md = readFileSync(
				new URL(`../md/${name}.md`, import.meta.url),
				"utf-8",
			);
			const json = readFileSync(
				new URL(`../md/${name}.json`, import.meta.url),
				"utf-8",
			);
			expect(
				JSON.parse(json),
				`${name}.json is stale — run \`npm run md-to-json\` and commit both files`,
			).toBe(md);
		},
	);
});

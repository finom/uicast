import { describe, expect, it } from "vitest";
import { parseFenceCode } from "../parse-fence-code";

describe("parseFenceCode", () => {
	it("parses one entry per line", () => {
		const code = [
			'{"key":"root","component":"Container","children":["a"]}',
			'{"key":"a","component":"Text"}',
		].join("\n");
		const entries = parseFenceCode(code);
		expect(entries).toHaveLength(2);
		expect(entries[0].key).toBe("root");
		expect(entries[1].component).toBe("Text");
	});

	it("skips the incomplete last line of a streaming fence", () => {
		const code = '{"key":"root","component":"Container"}\n{"key":"a","com';
		const entries = parseFenceCode(code);
		expect(entries).toHaveLength(1);
		expect(entries[0].key).toBe("root");
	});

	it("skips blank lines and non-entry JSON", () => {
		const code = ['{"key":"root","component":"C"}', "", '{"note":"not an entry"}', "42"].join(
			"\n",
		);
		expect(parseFenceCode(code)).toHaveLength(1);
	});

	it("returns [] for empty or prose-only content", () => {
		expect(parseFenceCode("")).toEqual([]);
		expect(parseFenceCode("just some text")).toEqual([]);
	});
});

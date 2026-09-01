import { standardTool } from "standard-tool";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getFunctionsPartialPrompt } from "../get-functions-partial-prompt";

describe("getFunctionsPartialPrompt", () => {
	it("renders no-schema tools inline", () => {
		const ping = standardTool({
			name: "ping",
			description: "Liveness check.",
			execute: async () => undefined,
		});
		expect(getFunctionsPartialPrompt({ functions: [ping] })).toBe(
			"# Available Functions\n\nping\n\n# Function Details\n\n- ping() => unknown: Liveness check.",
		);
	});

	it("renders object schemas multiline with per-field descriptions", () => {
		const updateOrder = standardTool({
			name: "updateOrder",
			description: "Update an order.",
			inputSchema: z.object({
				id: z.number().int().meta({ description: "Order id." }),
				qty: z.number().int().optional().meta({ description: "Quantity ordered." }),
			}),
			outputSchema: z.object({
				id: z.number().int().meta({ description: "Order id." }),
			}),
			execute: async () => ({ id: 1 }),
		});
		const prompt = getFunctionsPartialPrompt({ functions: [updateOrder] });
		expect(prompt).toContain(
			[
				"- updateOrder({",
				"    id: number /* Order id. */;",
				"    qty?: number /* Quantity ordered. */;",
				"  }) => {",
				"    id: number /* Order id. */;",
				"  }: Update an order.",
			].join("\n"),
		);
	});

	it.each(["scopes", "evt", "currentValue"])(
		"rejects a tool named %s, which would shadow the expression context",
		(name) => {
			const clashing = standardTool({
				name,
				description: "Shadows a context binding.",
				execute: async () => undefined,
			});
			expect(() => getFunctionsPartialPrompt({ functions: [clashing] })).toThrow(
				`Host function name "${name}" is reserved`,
			);
		},
	);

	it("rejects a name an expression cannot call", () => {
		const tool = standardTool({
			name: "foo-bar",
			description: "Not an identifier.",
			execute: async () => undefined,
		});
		expect(() => getFunctionsPartialPrompt({ functions: [tool] })).toThrow(
			'Host function name "foo-bar" is not a valid identifier',
		);
	});

	it("rejects a name that shadows an expression global", () => {
		const tool = standardTool({
			name: "Math",
			description: "Shadows a global.",
			execute: async () => undefined,
		});
		expect(() => getFunctionsPartialPrompt({ functions: [tool] })).toThrow(
			'Host function name "Math" is an expression global',
		);
	});

	it("rejects two tools sharing a name", () => {
		const make = (description: string) =>
			standardTool({ name: "listRows", description, execute: async () => undefined });
		expect(() =>
			getFunctionsPartialPrompt({ functions: [make("A."), make("B.")] }),
		).toThrow('Duplicate host function name: "listRows"');
	});

	it("renders a tool's title before its description", () => {
		const listOrders = standardTool({
			name: "listOrders",
			title: "List orders",
			description: "Every order, newest first.",
			execute: async () => undefined,
		});
		expect(getFunctionsPartialPrompt({ functions: [listOrders] })).toContain(
			"- listOrders() => unknown: List orders — Every order, newest first.",
		);
	});

	it("prints shared types after the function details, not before", () => {
		const Person = z
			.object({ id: z.string(), name: z.string().optional() })
			.meta({ id: "Person" });
		const getOwner = standardTool({
			name: "getOwner",
			description: "Who owns it.",
			outputSchema: z.object({ owner: Person }),
			execute: async () => ({ owner: { id: "1" } }),
		});
		expect(getFunctionsPartialPrompt({ functions: [getOwner] })).toBe(
			[
				"# Available Functions",
				"",
				"getOwner",
				"",
				"# Function Details",
				"",
				"- getOwner() => {",
				"    owner: Person;",
				"  }: Who owns it.",
				"",
				"# Shared Types",
				"",
				"- Person: { id: string; name?: string }",
			].join("\n"),
		);
	});

	it("indents nested objects one level deeper and keeps undescribed fields bare", () => {
		const ship = standardTool({
			name: "ship",
			description: "Ship it.",
			inputSchema: z.object({
				address: z
					.object({
						city: z.string().meta({ description: "City name." }),
						zip: z.string(),
					})
					.meta({ description: "Destination." }),
			}),
			execute: async () => undefined,
		});
		expect(getFunctionsPartialPrompt({ functions: [ship] })).toContain(
			[
				"- ship({",
				"    address: {",
				"      city: string /* City name. */;",
				"      zip: string;",
				"    } /* Destination. */;",
				"  }) => unknown: Ship it.",
			].join("\n"),
		);
	});
	it("renders note as a trailing ## Note section", () => {
		const out = getFunctionsPartialPrompt({
			functions: [],
			note: "Mutations must be re-fetched.",
		});
		expect(out.endsWith("## Note\n\nMutations must be re-fetched.")).toBe(true);
	});
});

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
			"# Available Functions\n\nping\n\n# Function Details\n\n- ping() => void: Liveness check.",
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
				"  }) => void: Ship it.",
			].join("\n"),
		);
	});
});

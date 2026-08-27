import z from "zod";
import { standardTool } from "standard-tool";

const ORDERS = [
  { id: 7, customer: "Maya Chen", total: 40 },
  { id: 8, customer: "Jonas Berg", total: 15 },
  { id: 9, customer: "Priya Nair", total: 92 },
];

export const listOrders = standardTool({
  name: "listOrders",
  description: "Every order, newest first.",
  outputSchema: z.array(
    z.object({
      id: z.number().int().meta({ description: "Order id" }),
      customer: z.string().meta({ description: "Who placed it" }),
      total: z.number().meta({ description: "Order total, in dollars" }),
    }),
  ),
  async execute() {
    // A real backend would be slower; the shuffle makes a refetch visible.
    await new Promise((resolve) => setTimeout(resolve, 350));
    const rotated = [...ORDERS];
    rotated.push(rotated.shift());
    ORDERS.splice(0, ORDERS.length, ...rotated);
    return rotated;
  },
});

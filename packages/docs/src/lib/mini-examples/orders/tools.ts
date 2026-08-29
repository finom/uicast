import z from "zod";
import { standardTool } from "standard-tool";

const ORDERS = [
  { id: 7, customer: "Maya Chen", total: 40 },
  { id: 8, customer: "Jonas Berg", total: 15 },
  { id: 9, customer: "Priya Nair", total: 92 },
  { id: 10, customer: "Tomas Ruiz", total: 28 },
];

export const listOrders = standardTool({
  name: "listOrders",
  description: "The three most recent orders.",
  outputSchema: z.array(
    z.object({
      id: z.number().int().meta({ description: "Order id" }),
      customer: z.string().meta({ description: "Who placed it" }),
      total: z.number().meta({ description: "Order total, in dollars" }),
    }),
  ),
  async execute() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    ORDERS.splice(0, ORDERS.length, ...ORDERS.slice(1), ...ORDERS.slice(0, 1));
    return ORDERS.slice(0, 3);
  },
});

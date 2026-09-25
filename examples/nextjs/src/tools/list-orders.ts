import z from "zod";
import { standardTool } from "standard-tool";

export const listOrders = standardTool({
  name: "listOrders",
  description: "Orders, newest first.",
  inputSchema: z.object({
    page: z.number().int().min(1).default(1).meta({ description: "1-based page number" }),
    status: z
      .enum(["all", "open", "refunded"])
      .default("all")
      .meta({ description: "Filter by order status" }),
  }),
  outputSchema: z.object({
    orders: z.array(
      z.object({
        id: z.number().int().meta({ description: "Order id" }),
        customer: z.string().meta({ description: "Who placed it" }),
        total: z.number().meta({ description: "Order total, in dollars" }),
      }),
    ),
    pageCount: z.number().int().meta({ description: "Total number of pages" }),
  }),
  execute: async ({ page, status }) =>
    (await fetch(`/api/orders?page=${page}&status=${status}`)).json(),
});

import { standardTool } from "standard-tool";
import { salesSummary, salesSummaryInput, stockSummary, stockSummaryInput } from "@/db/zod";
import { apiFetch, query } from "./http";

export const getSalesSummary = standardTool({
  name: "getSalesSummary",
  description:
    "Order totals for the last N days, cancelled orders excluded, with a per-day series; plus orders per status, all time.",
  inputSchema: salesSummaryInput.optional(),
  outputSchema: salesSummary,
  execute: (input) => apiFetch(`/api/orders/summary${query(input ?? {})}`),
});

export const getStockSummary = standardTool({
  name: "getStockSummary",
  description: "Catalog totals: products, units, stock value and the low-stock count, overall and per category.",
  inputSchema: stockSummaryInput.optional(),
  outputSchema: stockSummary,
  execute: (input) => apiFetch(`/api/products/summary${query(input ?? {})}`),
});

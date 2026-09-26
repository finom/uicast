import { standardTool } from "standard-tool";
import { movementInsert, movementListInput, movementListRow, movementOutput, pageOf } from "@/db/zod";
import { apiFetch, query } from "./http";

export const listStockMovements = standardTool({
  name: "listStockMovements",
  description: "A page of the stock ledger, newest first by default.",
  inputSchema: movementListInput.optional(),
  outputSchema: pageOf(movementListRow),
  execute: (input) => apiFetch(`/api/stock-movements${query(input ?? {})}`),
});

export const createStockMovement = standardTool({
  name: "createStockMovement",
  description:
    "Record a stock movement and adjust the product's stock atomically: positive qty receives stock, negative removes it. Fails with 409 when removal would take stock below zero.",
  inputSchema: movementInsert,
  outputSchema: movementOutput,
  execute: (input) =>
    apiFetch("/api/stock-movements", { method: "POST", body: input, success: "Stock movement recorded" }),
});

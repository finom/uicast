import { standardTool } from "standard-tool";
import { z } from "zod";
import { movementInsert, movementOutput } from "@/db/zod";
import { apiFetch } from "./http";

export const listStockMovements = standardTool({
  name: "listStockMovements",
  description: "List all stock movements (the stock ledger), newest first.",
  outputSchema: z.array(movementOutput),
  execute: () => apiFetch("/api/stock-movements"),
});

export const createStockMovement = standardTool({
  name: "createStockMovement",
  description:
    "Record a stock movement and adjust the product's stock atomically: positive qty receives stock, negative removes it. Fails with 409 when removal would take stock below zero.",
  inputSchema: movementInsert,
  outputSchema: movementOutput,
  execute: (input) => apiFetch("/api/stock-movements", { method: "POST", body: input, success: "Stock movement recorded" }),
});

import { standardTool } from "standard-tool";
import { z } from "zod";
import { orderInsert, orderOutput, orderUpdate } from "@/db/zod";
import { apiFetch } from "./http";

const idInput = z.object({ id: z.number().int().meta({ description: "Order id." }) });

export const listOrders = standardTool({
  name: "listOrders",
  description: "List all orders.",
  outputSchema: z.array(orderOutput),
  execute: () => apiFetch("/api/orders"),
});

export const getOrder = standardTool({
  name: "getOrder",
  description: "Get a single order by id.",
  inputSchema: idInput,
  outputSchema: orderOutput,
  execute: ({ id }) => apiFetch(`/api/orders/${id}`),
});

export const createOrder = standardTool({
  name: "createOrder",
  description: "Create an order. Returns the created order.",
  inputSchema: orderInsert,
  outputSchema: orderOutput,
  execute: (input) => apiFetch("/api/orders", { method: "POST", body: input }),
});

export const updateOrder = standardTool({
  name: "updateOrder",
  description: "Update an order by id (e.g. advance its status). Returns the updated order.",
  inputSchema: orderUpdate.extend(idInput.shape),
  outputSchema: orderOutput,
  execute: ({ id, ...patch }) => apiFetch(`/api/orders/${id}`, { method: "PATCH", body: patch }),
});

export const deleteOrder = standardTool({
  name: "deleteOrder",
  description: "Delete an order by id.",
  inputSchema: idInput,
  outputSchema: z.object({ id: z.number().int().meta({ description: "Id of the deleted order." }) }),
  execute: ({ id }) => apiFetch(`/api/orders/${id}`, { method: "DELETE" }),
});

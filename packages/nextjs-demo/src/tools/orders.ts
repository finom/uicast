import { standardTool } from "standard-tool";
import { z } from "zod";
import { orderIdInput, orderInsert, orderOutput, orderUpdate } from "@/db/zod";
import { apiFetch } from "./http";

export const listOrders = standardTool({
  name: "listOrders",
  description: "List all orders.",
  outputSchema: z.array(orderOutput),
  execute: () => apiFetch("/api/orders"),
});

export const getOrder = standardTool({
  name: "getOrder",
  description: "Get a single order by id.",
  inputSchema: orderIdInput,
  outputSchema: orderOutput,
  execute: ({ id }) => apiFetch(`/api/orders/${id}`),
});

export const createOrder = standardTool({
  name: "createOrder",
  description: "Create an order. Returns the created order.",
  inputSchema: orderInsert,
  outputSchema: orderOutput,
  execute: (input) => apiFetch("/api/orders", { method: "POST", body: input, success: "Order created" }),
});

export const updateOrder = standardTool({
  name: "updateOrder",
  description: "Update an order by id (e.g. advance its status). Returns the updated order.",
  inputSchema: orderUpdate.extend(orderIdInput.shape),
  outputSchema: orderOutput,
  execute: ({ id, ...patch }) => apiFetch(`/api/orders/${id}`, { method: "PATCH", body: patch, success: "Order updated" }),
});

export const deleteOrder = standardTool({
  name: "deleteOrder",
  description: "Delete an order by id.",
  inputSchema: orderIdInput,
  outputSchema: orderIdInput,
  execute: ({ id }) => apiFetch(`/api/orders/${id}`, { method: "DELETE", success: "Order deleted" }),
});

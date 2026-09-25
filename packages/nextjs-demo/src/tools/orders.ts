import { standardTool } from "standard-tool";
import { orderIdInput, orderInsert, orderListInput, orderListRow, orderOutput, orderUpdate, pageOf } from "@/db/zod";
import { apiFetch, query } from "./http";

export const listOrders = standardTool({
  name: "listOrders",
  description: "A page of orders, newest first by default.",
  inputSchema: orderListInput.optional(),
  outputSchema: pageOf(orderListRow),
  execute: (input) => apiFetch(`/api/orders${query(input ?? {})}`),
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
  execute: ({ id, ...patch }) =>
    apiFetch(`/api/orders/${id}`, { method: "PATCH", body: patch, success: "Order updated" }),
});

export const deleteOrder = standardTool({
  name: "deleteOrder",
  description: "Delete an order by id.",
  inputSchema: orderIdInput,
  outputSchema: orderIdInput,
  execute: ({ id }) => apiFetch(`/api/orders/${id}`, { method: "DELETE", success: "Order deleted" }),
});

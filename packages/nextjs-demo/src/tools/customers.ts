import { standardTool } from "standard-tool";
import {
  customerIdInput,
  customerInsert,
  customerListInput,
  customerListRow,
  customerOutput,
  customerUpdate,
  pageOf,
} from "@/db/zod";
import { apiFetch, query } from "./http";

export const listCustomers = standardTool({
  name: "listCustomers",
  description: "A page of customers with their order count and lifetime value, by name by default.",
  inputSchema: customerListInput.optional(),
  outputSchema: pageOf(customerListRow),
  execute: (input) => apiFetch(`/api/customers${query(input ?? {})}`),
});

export const getCustomer = standardTool({
  name: "getCustomer",
  description: "Get a single customer by id.",
  inputSchema: customerIdInput,
  outputSchema: customerOutput,
  execute: ({ id }) => apiFetch(`/api/customers/${id}`),
});

export const createCustomer = standardTool({
  name: "createCustomer",
  description: "Create a customer. Returns the created customer.",
  inputSchema: customerInsert,
  outputSchema: customerOutput,
  execute: (input) => apiFetch("/api/customers", { method: "POST", body: input, success: "Customer created" }),
});

export const updateCustomer = standardTool({
  name: "updateCustomer",
  description: "Update a customer by id. Returns the updated customer.",
  inputSchema: customerUpdate.extend(customerIdInput.shape),
  outputSchema: customerOutput,
  execute: ({ id, ...patch }) =>
    apiFetch(`/api/customers/${id}`, { method: "PATCH", body: patch, success: "Customer updated" }),
});

export const deleteCustomer = standardTool({
  name: "deleteCustomer",
  description: "Delete a customer by id. Fails with 409 when orders still reference the customer.",
  inputSchema: customerIdInput,
  outputSchema: customerIdInput,
  execute: ({ id }) => apiFetch(`/api/customers/${id}`, { method: "DELETE", success: "Customer deleted" }),
});

import { standardTool } from "standard-tool";
import { z } from "zod";
import { customerIdInput, customerInsert, customerOutput, customerUpdate } from "@/db/zod";
import { apiFetch } from "./http";

export const listCustomers = standardTool({
  name: "listCustomers",
  description: "List all customers.",
  outputSchema: z.array(customerOutput),
  execute: () => apiFetch("/api/customers"),
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
  execute: ({ id, ...patch }) => apiFetch(`/api/customers/${id}`, { method: "PATCH", body: patch, success: "Customer updated" }),
});

export const deleteCustomer = standardTool({
  name: "deleteCustomer",
  description:
    "Delete a customer by id. Fails with 409 when orders still reference the customer.",
  inputSchema: customerIdInput,
  outputSchema: customerIdInput,
  execute: ({ id }) => apiFetch(`/api/customers/${id}`, { method: "DELETE", success: "Customer deleted" }),
});

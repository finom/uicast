import { standardTool } from "standard-tool";
import { z } from "zod";
import { customerInsert, customerOutput, customerUpdate } from "@/db/zod";
import { apiFetch } from "./http";

const idInput = z.object({ id: z.number().int().meta({ description: "Customer id." }) });

export const listCustomers = standardTool({
  name: "listCustomers",
  description: "List all customers.",
  outputSchema: z.array(customerOutput),
  execute: () => apiFetch("/api/customers"),
});

export const getCustomer = standardTool({
  name: "getCustomer",
  description: "Get a single customer by id.",
  inputSchema: idInput,
  outputSchema: customerOutput,
  execute: ({ id }) => apiFetch(`/api/customers/${id}`),
});

export const createCustomer = standardTool({
  name: "createCustomer",
  description: "Create a customer. Returns the created customer.",
  inputSchema: customerInsert,
  outputSchema: customerOutput,
  execute: (input) => apiFetch("/api/customers", { method: "POST", body: input }),
});

export const updateCustomer = standardTool({
  name: "updateCustomer",
  description: "Update a customer by id. Returns the updated customer.",
  inputSchema: customerUpdate.extend(idInput.shape),
  outputSchema: customerOutput,
  execute: ({ id, ...patch }) => apiFetch(`/api/customers/${id}`, { method: "PATCH", body: patch }),
});

export const deleteCustomer = standardTool({
  name: "deleteCustomer",
  description:
    "Delete a customer by id. Fails with 409 when orders still reference the customer.",
  inputSchema: idInput,
  outputSchema: z.object({ id: z.number().int() }),
  execute: ({ id }) => apiFetch(`/api/customers/${id}`, { method: "DELETE" }),
});

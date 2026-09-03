import { standardTool } from "standard-tool";
import { pageOf, supplierIdInput, supplierInsert, supplierListInput, supplierOutput, supplierUpdate } from "@/db/zod";
import { apiFetch, query } from "./http";

export const listSuppliers = standardTool({
  name: "listSuppliers",
  description: "A page of suppliers, by name by default.",
  inputSchema: supplierListInput.optional(),
  outputSchema: pageOf(supplierOutput),
  execute: (input) => apiFetch(`/api/suppliers${query(input ?? {})}`),
});

export const getSupplier = standardTool({
  name: "getSupplier",
  description: "Get a single supplier by id.",
  inputSchema: supplierIdInput,
  outputSchema: supplierOutput,
  execute: ({ id }) => apiFetch(`/api/suppliers/${id}`),
});

export const createSupplier = standardTool({
  name: "createSupplier",
  description: "Create a supplier. Returns the created supplier.",
  inputSchema: supplierInsert,
  outputSchema: supplierOutput,
  execute: (input) => apiFetch("/api/suppliers", { method: "POST", body: input, success: "Supplier created" }),
});

export const updateSupplier = standardTool({
  name: "updateSupplier",
  description: "Update a supplier by id. Returns the updated supplier.",
  inputSchema: supplierUpdate.extend(supplierIdInput.shape),
  outputSchema: supplierOutput,
  execute: ({ id, ...patch }) => apiFetch(`/api/suppliers/${id}`, { method: "PATCH", body: patch, success: "Supplier updated" }),
});

export const deleteSupplier = standardTool({
  name: "deleteSupplier",
  description: "Delete a supplier by id. Fails with 409 when products still reference it.",
  inputSchema: supplierIdInput,
  outputSchema: supplierIdInput,
  execute: ({ id }) => apiFetch(`/api/suppliers/${id}`, { method: "DELETE", success: "Supplier deleted" }),
});

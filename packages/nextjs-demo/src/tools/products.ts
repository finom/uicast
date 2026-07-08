import { standardTool } from "standard-tool";
import { z } from "zod";
import { productInsert, productOutput, productUpdate } from "@/db/zod";
import { apiFetch } from "./http";

const idInput = z.object({ id: z.number().int().meta({ description: "Product id." }) });

export const listProducts = standardTool({
  name: "listProducts",
  description: "List all products.",
  outputSchema: z.array(productOutput),
  execute: () => apiFetch("/api/products"),
});

export const getProduct = standardTool({
  name: "getProduct",
  description: "Get a single product by id.",
  inputSchema: idInput,
  outputSchema: productOutput,
  execute: ({ id }) => apiFetch(`/api/products/${id}`),
});

export const createProduct = standardTool({
  name: "createProduct",
  description: "Create a product. Returns the created product.",
  inputSchema: productInsert,
  outputSchema: productOutput,
  execute: (input) => apiFetch("/api/products", { method: "POST", body: input }),
});

export const updateProduct = standardTool({
  name: "updateProduct",
  description: "Update a product by id. Returns the updated product.",
  inputSchema: productUpdate.extend(idInput.shape),
  outputSchema: productOutput,
  execute: ({ id, ...patch }) => apiFetch(`/api/products/${id}`, { method: "PATCH", body: patch }),
});

export const deleteProduct = standardTool({
  name: "deleteProduct",
  description: "Delete a product by id. Fails with 409 when orders still reference the product.",
  inputSchema: idInput,
  outputSchema: z.object({ id: z.number().int() }),
  execute: ({ id }) => apiFetch(`/api/products/${id}`, { method: "DELETE" }),
});

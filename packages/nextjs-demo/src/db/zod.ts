import { z } from "zod";
import { MOVEMENT_REASONS, ORDER_STATUSES } from "./schema";

// Zod companions for the Drizzle tables. The domain schemas (products /
// customers / orders) carry per-field `.meta({ description })` so they serialize
// into JSON Schema with descriptions when fed to standard-tool / the prompt.

// ---- suppliers ----
export const supplierInsert = z.object({
  name: z.string().meta({ description: "Supplier company name." }),
  email: z.string().meta({ description: "Contact email for purchase orders." }),
  category: z.string().meta({ description: "Product category this supplier covers." }),
  leadTimeDays: z.number().int().meta({ description: "Typical delivery lead time, in days." }),
});
export const supplierUpdate = supplierInsert.partial();
export const supplierOutput = supplierInsert.extend({
  id: z.number().int().meta({ description: "Supplier id." }),
});

// ---- stock movements ----
export const movementInsert = z.object({
  productId: z.number().int().meta({ description: "Product the stock moves for." }),
  qty: z
    .number()
    .int()
    .meta({ description: "Quantity moved: positive receives stock, negative removes it." }),
  reason: z.enum(MOVEMENT_REASONS).meta({ description: "Why the stock moved." }),
  note: z.string().nullish().meta({ description: "Optional free-form note." }),
});
export const movementOutput = movementInsert.extend({
  id: z.number().int().meta({ description: "Movement id." }),
  createdAt: z.string().meta({ description: "ISO timestamp of the movement." }),
});

// ---- products ----
export const productInsert = z.object({
  supplierId: z.number().int().meta({ description: "Id of the supplier this product is ordered from." }),
  name: z.string().meta({ description: "Product name." }),
  sku: z.string().meta({ description: "Stock-keeping unit (SKU) code." }),
  category: z.string().meta({ description: "Product category." }),
  stock: z.number().int().meta({ description: "Units currently in stock." }),
  price: z.number().meta({ description: "Unit price, in dollars." }),
});
export const productUpdate = productInsert.partial();
export const productOutput = productInsert.extend({
  id: z.number().int().meta({ description: "Product id." }),
});

// ---- customers ----
export const customerInsert = z.object({
  name: z.string().meta({ description: "Customer's full name." }),
  company: z.string().meta({ description: "Company the customer belongs to." }),
  email: z.string().meta({ description: "Customer's email address." }),
});
export const customerUpdate = customerInsert.partial();
export const customerOutput = customerInsert.extend({
  id: z.number().int().meta({ description: "Customer id." }),
  createdAt: z.string().meta({ description: "ISO timestamp the customer was created." }),
});

// ---- orders ----
export const orderInsert = z.object({
  customerId: z.number().int().meta({ description: "ID of the customer who placed the order." }),
  productId: z.number().int().meta({ description: "ID of the product ordered." }),
  productName: z.string().meta({ description: "Product name at time of sale (snapshot)." }),
  qty: z.number().int().meta({ description: "Quantity ordered." }),
  unitPrice: z.number().meta({ description: "Unit price at time of sale (snapshot)." }),
  total: z.number().meta({ description: "Order total (qty × unitPrice)." }),
  status: z.enum(ORDER_STATUSES).optional().meta({ description: "Order status." }),
});
export const orderUpdate = orderInsert.partial();
export const orderOutput = orderInsert.extend({
  id: z.number().int().meta({ description: "Order id." }),
  status: z.enum(ORDER_STATUSES).meta({ description: "Order status." }),
  createdAt: z.string().meta({ description: "ISO timestamp the order was created." }),
});

// ---- pages (no tools; route validation only) ----
export const pageInsert = z.object({
  title: z.string().min(1),
  prompt: z.string().nullish(),
});
export const pageUpdate = pageInsert.partial();

// ---- id inputs, picked from the outputs so descriptions stay single-source ----
export const productIdInput = productOutput.pick({ id: true });
export const customerIdInput = customerOutput.pick({ id: true });
export const orderIdInput = orderOutput.pick({ id: true });
export const supplierIdInput = supplierOutput.pick({ id: true });

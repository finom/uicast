import { z } from "zod";
import { MOVEMENT_REASONS, ORDER_STATUSES } from "./schema";

// Zod companions for the Drizzle tables. `.meta({ description })` says what a
// field is; the validators say the rest, and the prompt prints both. A row
// schema's `.meta({ id })` makes it one shared type in the prompt.

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
}).meta({ id: "Supplier" });

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
}).meta({ id: "StockMovement" });

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
}).meta({ id: "Product" });

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
}).meta({ id: "Customer" });

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
}).meta({ id: "Order" });

// ---- list windows: one schema reads the tool call (numbers) and the route's query string (strings) ----
export const listWindow = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).default(50).meta({ description: "Rows to return." }),
    offset: z.coerce.number().int().min(0).default(0).meta({ description: "Rows to skip." }),
  })
  .meta({ id: "Window" });

// `sort` names a returned field.
const sortable = <const K extends string>(keys: readonly [K, ...K[]], first: K, order: "asc" | "desc") => ({
  sort: z.enum(keys).default(first).meta({ description: "Sort field." }),
  order: z.enum(["asc", "desc"]).default(order).meta({ description: "Sort direction." }),
});

export const supplierListInput = listWindow.and(
  z.object({
    ...sortable(["name", "leadTimeDays", "category"], "name", "asc"),
    q: z.string().optional().meta({ description: "Matches the name, case-insensitive." }),
    category: z.string().optional().meta({ description: "Only this category." }),
  }),
);

export const movementListInput = listWindow.and(
  z.object({
    ...sortable(["createdAt", "qty"], "createdAt", "desc"),
    q: z.string().optional().meta({ description: "Matches the product name, case-insensitive." }),
    productId: z.coerce.number().int().optional().meta({ description: "Only this product." }),
    reason: z.enum(MOVEMENT_REASONS).optional().meta({ description: "Only this reason." }),
  }),
);
export const movementListRow = movementOutput
  .extend({ productName: z.string().meta({ description: "The product's current name." }) })
  .meta({ id: "StockMovementListRow" });

export const productListInput = listWindow.and(
  z.object({
    ...sortable(["name", "stock", "price", "category", "id"], "name", "asc"),
    q: z.string().optional().meta({ description: "Matches the name or SKU, case-insensitive." }),
    category: z.string().optional().meta({ description: "Only this category." }),
    supplierId: z.coerce.number().int().optional().meta({ description: "Only this supplier." }),
    stockAtMost: z.coerce.number().int().optional().meta({ description: "Only products with this many units or fewer." }),
  }),
);

export const customerListInput = listWindow.and(
  z.object({
    ...sortable(["name", "company", "createdAt", "orders", "lifetime"], "name", "asc"),
    q: z.string().optional().meta({ description: "Matches the name or company, case-insensitive." }),
  }),
);
export const customerListRow = customerOutput
  .extend({
    orders: z.number().int().meta({ description: "Orders placed." }),
    lifetime: z.number().meta({ description: "Total of the customer's orders but cancelled ones, in dollars." }),
  })
  .meta({ id: "CustomerListRow" });

export const orderListInput = listWindow.and(
  z.object({
    ...sortable(["createdAt", "total", "id"], "createdAt", "desc"),
    q: z.string().optional().meta({ description: "Matches the product or customer name, case-insensitive." }),
    status: z.enum(ORDER_STATUSES).optional().meta({ description: "Only this status." }),
    customerId: z.coerce.number().int().optional().meta({ description: "Only this customer." }),
    productId: z.coerce.number().int().optional().meta({ description: "Only this product." }),
    minTotal: z.coerce.number().optional().meta({ description: "Only orders with at least this total." }),
    from: z.iso.date().optional().meta({ description: "Only orders on or after this day." }),
  }),
);
export const orderListRow = orderOutput
  .extend({ customerName: z.string().meta({ description: "The customer's current name." }) })
  .meta({ id: "OrderListRow" });

// A window's result: the rows, the count over the same filters, and the window applied.
export const pageOf = <T extends z.ZodType>(row: T) =>
  z.object({
    items: z.array(row),
    total: z.number().int().meta({ description: "Rows matching the filters, all pages." }),
    limit: z.number().int().meta({ description: "The window applied." }),
    offset: z.number().int().meta({ description: "Rows skipped." }),
  });

// ---- summaries ----
export const salesSummaryInput = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30).meta({ description: "The last N days." }),
});
export const salesSummary = z.object({
  count: z.number().int().meta({ description: "Orders in the window." }),
  revenue: z.number().meta({ description: "Total of the orders in the window, in dollars." }),
  avgOrder: z.number().meta({ description: "Average order total, in dollars." }),
  customers: z.number().int().meta({ description: "Distinct customers who ordered in the window." }),
  byStatus: z
    .array(z.object({ status: z.enum(ORDER_STATUSES), count: z.number().int() }))
    .meta({ description: "Orders per status, all time." }),
  byDay: z
    .array(
      z.object({
        date: z.string().meta({ description: "YYYY-MM-DD." }),
        revenue: z.number(),
        orders: z.number().int(),
      }),
    )
    .meta({ description: "Per day in the window, oldest first." }),
});

export const stockSummaryInput = z.object({
  lowStockAtMost: z.coerce.number().int().min(0).default(20).meta({ description: "A product is low on stock at this many units or fewer." }),
});
export const stockSummary = z.object({
  products: z.number().int().meta({ description: "Products in the catalog." }),
  units: z.number().int().meta({ description: "Units in stock, all products." }),
  value: z.number().meta({ description: "Stock value at unit price, in dollars." }),
  lowStock: z.number().int().meta({ description: "Products low on stock." }),
  byCategory: z
    .array(z.object({ category: z.string(), products: z.number().int(), units: z.number().int(), value: z.number() }))
    .meta({ description: "Per category, largest value first." }),
  bySupplier: z
    .array(z.object({ supplierId: z.number().int(), products: z.number().int(), units: z.number().int(), value: z.number() }))
    .meta({ description: "Per supplier, largest value first; a supplier with no products is absent." }),
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

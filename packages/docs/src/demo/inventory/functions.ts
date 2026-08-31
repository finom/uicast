import { type StandardToolV0, standardTool } from "standard-tool";
import { z } from "zod";
import { db, type Product } from "./db";

/**
 * The host functions exposed to expressions via `<RendererProvider functions=…>`.
 *
 * Built with `standardTool()` — "tool" is just the `standard-tool` engine's
 * word; in this app they're the render *functions* a generated UI calls. The
 * engine invokes `fn.execute(input)` (single arg, no meta), so each `execute`
 * closes over the Dexie singleton directly. Mirrors the production wiring,
 * with a browser database in place of a remote data source.
 */

// IndexedDB is near-instant; a small simulated round-trip makes the async
// `seed` (Suspense) loading state actually visible in the demo, the way a
// real network-backed data source would behave. Writes stay instant.
const NETWORK_MS = 300;
const simulateLatency = () =>
  new Promise<void>((resolve) => setTimeout(resolve, NETWORK_MS));

/** Draft shape for create/update. The form always supplies all fields (root
 *  seeds them to "" / 0), and NumberInput/CurrencyInput emit numbers, so plain
 *  schemas are correct and keep the inferred input type exact. */
const ProductDraft = z.object({
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  stock: z.number(),
  price: z.number(),
});

/** Full row as stored — what every read/write returns. Mirrors `Product`. */
const ProductOutput = ProductDraft.extend({ id: z.number() });

// ---- reads (used as async `seed`) -------------------------------------

const listProducts = standardTool({
  name: "listProducts",
  description: "Return every product in the inventory, newest first.",
  outputSchema: z.array(ProductOutput),
  async execute(): Promise<Product[]> {
    await simulateLatency();
    return db.products.orderBy("id").reverse().toArray();
  },
});

const getCategoryBreakdown = standardTool({
  name: "getCategoryBreakdown",
  description:
    "Return total units in stock grouped by category, as { name, value } rows for charting.",
  outputSchema: z.array(z.object({ name: z.string(), value: z.number() })),
  async execute() {
    await simulateLatency();
    const products = await db.products.toArray();
    const byCategory = new Map<string, number>();
    for (const p of products) {
      byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + p.stock);
    }
    return Array.from(byCategory, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  },
});

// ---- writes (used in `callbacks`) -----------------------------------------

const createProduct = standardTool({
  name: "createProduct",
  description: "Add a new product to the inventory. Returns the created product.",
  inputSchema: ProductDraft,
  outputSchema: ProductOutput,
  async execute(input): Promise<Product> {
    const id = await db.products.add(input);
    return { ...input, id };
  },
});

const updateProduct = standardTool({
  name: "updateProduct",
  description: "Update an existing product by id. Returns the updated product.",
  inputSchema: ProductDraft.extend({ id: z.number() }),
  outputSchema: ProductOutput,
  async execute(input): Promise<Product> {
    const { id, ...changes } = input;
    await db.products.update(id, changes);
    return { id, ...changes };
  },
});

const deleteProduct = standardTool({
  name: "deleteProduct",
  description: "Delete a product from the inventory by id.",
  inputSchema: z.object({ id: z.number() }),
  outputSchema: z.object({ id: z.number() }),
  async execute({ id }) {
    await db.products.delete(id);
    return { id };
  },
});

/** Passed verbatim to `<RendererProvider functions={inventoryFunctions}>`. */
export const inventoryFunctions: StandardToolV0[] = [
  listProducts,
  getCategoryBreakdown,
  createProduct,
  updateProduct,
  deleteProduct,
];

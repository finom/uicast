import { seedProducts } from "../lib/seed";

/**
 * The illustrative prompt that "generated" the inventory app — shown next to
 * the Play button so the demo reads as prompt → streamed UI. It embeds a small
 * sample of the (deterministic) seed data, mirroring how a real generator is
 * given a slice of the data source. No model is actually called.
 */

const sampleRows = seedProducts
  .slice(0, 5)
  .map(
    (p) =>
      `  { name: ${JSON.stringify(p.name)}, sku: ${JSON.stringify(p.sku)}, category: ${JSON.stringify(
        p.category,
      )}, stock: ${p.stock}, price: ${p.price} }`,
  )
  .join(",\n");

export const inventoryPrompt = `# Build request

Build an inventory dashboard for our product catalog. Across the top show
summary stats — total SKUs, low-stock count, and total inventory value — then a
"stock by category" bar chart, then a searchable products table. I need to add a
new product, edit an existing one, and delete one (with a confirmation prompt).
Keep the stats, chart, and table in sync as I make changes.

# Data source

A single "products" collection (${seedProducts.length} rows). Each product has:
name, sku, category, stock (units on hand), and price (USD). Sample rows:

[
${sampleRows}
]

# Available functions

- listProducts() -> Product[]
- getCategoryBreakdown() -> { name, value }[]
- createProduct({ name, sku, category, stock, price }) -> Product
- updateProduct({ id, name, sku, category, stock, price }) -> Product
- deleteProduct({ id }) -> { id }
`;

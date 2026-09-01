import { customers, orders, products, stockMovements, suppliers } from "./schema";
import { db } from "./index";

// The domain dataset every user starts with (and the seed user's data).
// Deterministic, so a fresh login and the public demo look the same. The stock
// ledger reconciles exactly: every order gets a "shipped" movement, and
// "received" batches balance each product to its current stock.

export const STARTER_SUPPLIERS = [
  { name: "Lumen Trade Co.", email: "orders@lumentrade.eu", category: "Lighting", leadTimeDays: 7 },
  { name: "Nordform Werk", email: "sales@nordform.de", category: "Furniture", leadTimeDays: 21 },
  { name: "Circuitry Direct", email: "b2b@circuitrydirect.com", category: "Electronics", leadTimeDays: 10 },
  { name: "Atelier Supply", email: "hello@ateliersupply.fr", category: "Accessories", leadTimeDays: 5 },
];

export const STARTER_PRODUCTS = [
  { name: "Aurora Desk Lamp", sku: "SKU-LAMP-01", category: "Lighting", stock: 42, price: 59 },
  { name: "Birch Standing Desk", sku: "SKU-DESK-02", category: "Furniture", stock: 15, price: 449 },
  { name: "ErgoFlex Chair", sku: "SKU-CHAIR-03", category: "Furniture", stock: 23, price: 289 },
  { name: "Quiet Mechanical Keyboard", sku: "SKU-KEYB-04", category: "Electronics", stock: 60, price: 129 },
  { name: '4K Monitor 27"', sku: "SKU-MON-05", category: "Electronics", stock: 34, price: 379 },
  { name: "Felt Desk Mat", sku: "SKU-MAT-06", category: "Accessories", stock: 120, price: 24 },
  { name: "Cable Organizer Kit", sku: "SKU-CABL-07", category: "Accessories", stock: 200, price: 15 },
  { name: "Noise-Cancelling Headset", sku: "SKU-HEAD-08", category: "Electronics", stock: 48, price: 199 },
  { name: "Laptop Stand", sku: "SKU-STAND-09", category: "Accessories", stock: 75, price: 49 },
  { name: "Conference Speakerphone", sku: "SKU-SPKR-10", category: "Electronics", stock: 18, price: 159 },
  { name: "Dual Monitor Arm", sku: "SKU-ARM-11", category: "Accessories", stock: 40, price: 89 },
  { name: "Walnut Bookshelf", sku: "SKU-SHLF-12", category: "Furniture", stock: 8, price: 349 },
];

export const STARTER_CUSTOMERS = [
  { name: "Ada Lindqvist", company: "Northwind Labs", email: "ada@northwind.dev" },
  { name: "Marcus Chen", company: "Foxglove Systems", email: "marcus@foxglove.io" },
  { name: "Priya Raman", company: "Halcyon Works", email: "priya@halcyon.co" },
  { name: "Jonas Weber", company: "Kupfer & Sohn", email: "jonas@kupfer.de" },
  { name: "Sofia Reyes", company: "Playa Digital", email: "sofia@playa.mx" },
  { name: "Tomasz Nowak", company: "Wisla Cloud", email: "tomasz@wisla.pl" },
  { name: "Emily Hart", company: "Hartwood Studio", email: "emily@hartwood.design" },
  { name: "Yuki Tanaka", company: "Sakura Metrics", email: "yuki@sakura.jp" },
];

// (customerIndex, productIndex, qty, daysAgo, status) — snapshots derive.
const STARTER_ORDERS: [number, number, number, number, string][] = [
  [0, 1, 1, 2, "paid"],
  [0, 3, 2, 9, "delivered"],
  [1, 4, 3, 1, "pending"],
  [1, 7, 1, 20, "delivered"],
  [2, 0, 4, 3, "shipped"],
  [2, 11, 1, 6, "paid"],
  [3, 2, 2, 12, "delivered"],
  [3, 8, 5, 4, "shipped"],
  [4, 5, 10, 1, "pending"],
  [4, 9, 1, 15, "cancelled"],
  [5, 6, 20, 5, "paid"],
  [5, 10, 2, 8, "delivered"],
  [6, 3, 1, 2, "paid"],
  [6, 4, 2, 30, "delivered"],
  [7, 7, 2, 7, "shipped"],
  [7, 0, 1, 11, "delivered"],
  [1, 2, 1, 5, "paid"],
  [4, 8, 3, 2, "pending"],
];

/** Give `userId` its own copy of the starter dataset. Call once, at user creation. */
export async function insertStarterData(userId: string): Promise<void> {
  const supplierRows = await db
    .insert(suppliers)
    .values(STARTER_SUPPLIERS.map((sup) => ({ ...sup, userId })))
    .returning({ id: suppliers.id, category: suppliers.category });
  const supplierByCategory = new Map(supplierRows.map((sup) => [sup.category, sup.id]));

  const productRows = await db
    .insert(products)
    .values(
      STARTER_PRODUCTS.map((prod) => ({
        ...prod,
        userId,
        supplierId: supplierByCategory.get(prod.category) ?? supplierRows[0].id,
      })),
    )
    .returning({ id: products.id });
  const customerRows = await db
    .insert(customers)
    .values(STARTER_CUSTOMERS.map((c) => ({ ...c, userId })))
    .returning({ id: customers.id });

  const now = Date.now();
  const day = (n: number) => new Date(now - n * 86_400_000);

  await db.insert(orders).values(
    STARTER_ORDERS.map(([ci, pi, qty, daysAgo, status]) => {
      const product = STARTER_PRODUCTS[pi];
      return {
        userId,
        customerId: customerRows[ci].id,
        productId: productRows[pi].id,
        productName: product.name,
        qty,
        unitPrice: product.price,
        total: qty * product.price,
        status: status as (typeof orders.$inferInsert)["status"],
        createdAt: day(daysAgo),
      };
    }),
  );

  // The ledger: one "shipped" row per non-cancelled order, and "received"
  // batches dated before the first sale so each product sums to its stock.
  const movements: (typeof stockMovements.$inferInsert)[] = [];
  const shippedByProduct = new Map<number, number>();
  for (const [, pi, qty, daysAgo, status] of STARTER_ORDERS) {
    if (status === "cancelled") continue;
    movements.push({
      userId,
      productId: productRows[pi].id,
      qty: -qty,
      reason: "shipped",
      note: null,
      createdAt: day(daysAgo),
    });
    shippedByProduct.set(pi, (shippedByProduct.get(pi) ?? 0) + qty);
  }
  STARTER_PRODUCTS.forEach((prod, pi) => {
    const totalIn = prod.stock + (shippedByProduct.get(pi) ?? 0);
    const first = Math.ceil(totalIn / 2);
    movements.push({
      userId,
      productId: productRows[pi].id,
      qty: first,
      reason: "received",
      note: "Initial delivery",
      createdAt: day(45),
    });
    if (totalIn - first > 0) {
      movements.push({
        userId,
        productId: productRows[pi].id,
        qty: totalIn - first,
        reason: "received",
        note: "Restock",
        createdAt: day(32),
      });
    }
  });
  await db.insert(stockMovements).values(movements);
}

// Seeds the domain tables (products, customers, orders) that generated pages
// query at runtime. Pages and their component entries are left untouched.
// Idempotent: wipes and re-inserts the three tables on every run, with a
// fixed-seed RNG so every run produces the same dataset.
// Column lists must track src/db/schema.ts.
import path from "node:path";
import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH ?? path.join(import.meta.dirname, "../data/app.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// mulberry32 — tiny deterministic PRNG.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const PRODUCTS = [
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
];

const CUSTOMERS = [
  { name: "Ada Thompson", company: "Northwind Labs", email: "ada@northwindlabs.com" },
  { name: "Bruno Keller", company: "Keller & Sons", email: "bruno@kellersons.de" },
  { name: "Chiara Ricci", company: "Ricci Design", email: "chiara@riccidesign.it" },
  { name: "Daniel Okafor", company: "Okafor Logistics", email: "daniel@okaforlogistics.com" },
  { name: "Emma Lindqvist", company: "Lindqvist Studio", email: "emma@lindqvist.se" },
  { name: "Farid Haddad", company: "Haddad Trading", email: "farid@haddadtrading.com" },
  { name: "Grace Park", company: "Park Analytics", email: "grace@parkanalytics.io" },
  { name: "Hugo Martins", company: "Martins Café", email: "hugo@martinscafe.pt" },
];

const ORDER_COUNT = 45;

// Weighted status mix; the first five orders cycle through every status so
// no dashboard bucket comes up empty.
const ALL_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];
function pickStatus(orderIndex) {
  if (orderIndex < ALL_STATUSES.length) return ALL_STATUSES[orderIndex];
  const r = rand();
  if (r < 0.15) return "pending";
  if (r < 0.4) return "paid";
  if (r < 0.65) return "shipped";
  if (r < 0.95) return "delivered";
  return "cancelled";
}

const nowSec = Math.floor(Date.now() / 1000);
const daysAgoSec = (days) => nowSec - days * 86400;

const seed = db.transaction(() => {
  // FK-safe wipe order: orders reference products and customers.
  db.prepare("DELETE FROM orders").run();
  db.prepare("DELETE FROM customers").run();
  db.prepare("DELETE FROM products").run();

  const insertProduct = db.prepare(
    "INSERT INTO products (name, sku, category, stock, price) VALUES (@name, @sku, @category, @stock, @price)",
  );
  const productIds = PRODUCTS.map((p) => Number(insertProduct.run(p).lastInsertRowid));

  const insertCustomer = db.prepare(
    "INSERT INTO customers (name, company, email, created_at) VALUES (@name, @company, @email, @createdAt)",
  );
  const customerIds = CUSTOMERS.map((c) =>
    Number(insertCustomer.run({ ...c, createdAt: daysAgoSec(int(30, 360)) }).lastInsertRowid),
  );

  const insertOrder = db.prepare(
    `INSERT INTO orders (customer_id, product_id, product_name, qty, unit_price, total, status, created_at)
     VALUES (@customerId, @productId, @productName, @qty, @unitPrice, @total, @status, @createdAt)`,
  );
  for (let i = 0; i < ORDER_COUNT; i++) {
    const productIndex = int(0, PRODUCTS.length - 1);
    const product = PRODUCTS[productIndex];
    const qty = int(1, 5);
    insertOrder.run({
      customerId: pick(customerIds),
      productId: productIds[productIndex],
      productName: product.name,
      qty,
      unitPrice: product.price,
      total: Math.round(qty * product.price * 100) / 100,
      status: pickStatus(i),
      createdAt: daysAgoSec(int(0, 90)),
    });
  }
});

seed();

console.log(
  `Seeded ${PRODUCTS.length} products, ${CUSTOMERS.length} customers, ${ORDER_COUNT} orders into ${dbPath}`,
);
db.close();

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
  { name: "Dual Monitor Arm", sku: "SKU-ARM-11", category: "Accessories", stock: 40, price: 89 },
  { name: "USB-C Dock Pro", sku: "SKU-DOCK-12", category: "Electronics", stock: 55, price: 149 },
  { name: "1080p Webcam", sku: "SKU-CAM-13", category: "Electronics", stock: 66, price: 79 },
  { name: "Wireless Ergo Mouse", sku: "SKU-MOUS-14", category: "Electronics", stock: 90, price: 59 },
  { name: "Glass Whiteboard 90cm", sku: "SKU-WHTB-15", category: "Office", stock: 12, price: 219 },
  { name: "Acoustic Wall Panel Set", sku: "SKU-ACOU-16", category: "Office", stock: 25, price: 129 },
  { name: "Adjustable Footrest", sku: "SKU-FOOT-17", category: "Furniture", stock: 38, price: 45 },
  { name: "Walnut Bookshelf", sku: "SKU-SHLF-18", category: "Furniture", stock: 9, price: 329 },
  { name: "Rolling File Cabinet", sku: "SKU-FILE-19", category: "Furniture", stock: 21, price: 179 },
  { name: "Clip-On Task Light", sku: "SKU-TASK-20", category: "Lighting", stock: 58, price: 35 },
  { name: "Ambient Light Bar", sku: "SKU-LBAR-21", category: "Lighting", stock: 47, price: 69 },
  { name: "Power Strip Tower", sku: "SKU-PWRT-22", category: "Accessories", stock: 84, price: 39 },
  { name: "Memory-Foam Wrist Rest", sku: "SKU-WRST-23", category: "Accessories", stock: 110, price: 19 },
  { name: "Desk Plant & Pot", sku: "SKU-PLNT-24", category: "Office", stock: 70, price: 22 },
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
  { name: "Ines Almeida", company: "Almeida Arquitetura", email: "ines@almeidaarq.pt" },
  { name: "Jonas Weber", company: "Weber Consulting", email: "jonas@weberconsult.de" },
  { name: "Keiko Tanaka", company: "Tanaka Robotics", email: "keiko@tanakarobotics.jp" },
  { name: "Liam O'Brien", company: "O'Brien Media", email: "liam@obrienmedia.ie" },
  { name: "Marta Kowalska", company: "Kowalska Legal", email: "marta@kowalskalegal.pl" },
  { name: "Nikolai Sokolov", company: "Sokolov Freight", email: "nikolai@sokolovfreight.com" },
  { name: "Olivia Chen", company: "Chen Ventures", email: "olivia@chenventures.io" },
  { name: "Pablo Reyes", company: "Reyes Foods", email: "pablo@reyesfoods.mx" },
  { name: "Queenie Wong", company: "Wong & Partners", email: "queenie@wongpartners.hk" },
  { name: "Ravi Sharma", company: "Sharma EdTech", email: "ravi@sharmaedtech.in" },
  { name: "Sofia Petrova", company: "Petrova Studio", email: "sofia@petrovastudio.bg" },
  { name: "Tom Becker", company: "Becker Brewing", email: "tom@beckerbrewing.com" },
];

const ORDER_COUNT = 220;

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
      // Recency-weighted: most orders land in the last quarter, the rest
      // spread over the year so monthly charts have a full x-axis.
      createdAt: daysAgoSec(rand() < 0.6 ? int(0, 90) : int(91, 365)),
    });
  }
});

seed();

console.log(
  `Seeded ${PRODUCTS.length} products, ${CUSTOMERS.length} customers, ${ORDER_COUNT} orders into ${dbPath}`,
);
db.close();

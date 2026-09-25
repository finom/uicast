// biome-ignore-all format: one entry or row per line
import { customers, type ORDER_STATUSES, orders, products, stockMovements, suppliers } from "./schema";
import { db } from "./index";

// Deterministic. The ledger reconciles: every order not cancelled gets a "shipped" movement and "received" batches balance each product.

const NAMED_SUPPLIERS = [
  { name: "Lumen Trade Co.", email: "orders@lumentrade.eu", category: "Lighting", leadTimeDays: 7 },
  { name: "Nordform Werk", email: "sales@nordform.de", category: "Furniture", leadTimeDays: 21 },
  { name: "Circuitry Direct", email: "b2b@circuitrydirect.com", category: "Electronics", leadTimeDays: 10 },
  { name: "Atelier Supply", email: "hello@ateliersupply.fr", category: "Accessories", leadTimeDays: 5 },
];

const NAMED_PRODUCTS = [
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

const NAMED_CUSTOMERS = [
  { name: "Ada Lindqvist", company: "Northwind Labs", email: "ada@northwind.dev" },
  { name: "Marcus Chen", company: "Foxglove Systems", email: "marcus@foxglove.io" },
  { name: "Priya Raman", company: "Halcyon Works", email: "priya@halcyon.co" },
  { name: "Jonas Weber", company: "Kupfer & Sohn", email: "jonas@kupfer.de" },
  { name: "Sofia Reyes", company: "Playa Digital", email: "sofia@playa.mx" },
  { name: "Tomasz Nowak", company: "Wisla Cloud", email: "tomasz@wisla.pl" },
  { name: "Emily Hart", company: "Hartwood Studio", email: "emily@hartwood.design" },
  { name: "Yuki Tanaka", company: "Sakura Metrics", email: "yuki@sakura.jp" },
];

type OrderStatus = (typeof ORDER_STATUSES)[number];
type StarterOrder = [customerIndex: number, productIndex: number, qty: number, daysAgo: number, status: OrderStatus];
const NAMED_ORDERS: StarterOrder[] = [
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


// mulberry32.
function makeRandom(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Generated stock stays above 20 and a generated account under $800 lifetime, so the seeded chats' prose stays true.
const EXTRA_SUPPLIERS = [
  { name: "Klangwerk Audio", email: "b2b@klangwerk.de", category: "Audio", leadTimeDays: 12 },
  { name: "Vault Storage Systems", email: "sales@vaultstorage.com", category: "Storage", leadTimeDays: 14 },
  { name: "Papyrus Office", email: "orders@papyrus.it", category: "Office", leadTimeDays: 4 },
  { name: "Copperline Cables", email: "trade@copperline.cn", category: "Cables", leadTimeDays: 18 },
  { name: "Pixelgrade Displays", email: "wholesale@pixelgrade.kr", category: "Displays", leadTimeDays: 16 },
  { name: "Formsense Ergonomics", email: "hello@formsense.se", category: "Ergonomics", leadTimeDays: 9 },
];

const EXTRA_CATALOG: Record<string, { code: string; names: string[]; price: [number, number] }> = {
  Audio: { code: "AUD", names: ["Studio Monitor Pair", "USB Microphone", "Desk Speaker Bar", "Wireless Earbuds", "Podcast Mixer", "Headphone Stand", "Bluetooth Receiver"], price: [29, 249] },
  Storage: { code: "STO", names: ["Rolling Pedestal", "Wall Shelf Unit", "Lockable Cabinet", "Desk Drawer Insert", "Filing Tower", "Cable Tray", "Under-desk Rack"], price: [19, 199] },
  Office: { code: "OFF", names: ["Whiteboard 90cm", "Notebook Pack", "Gel Pen Set", "Desk Calendar", "Sticky Note Cube", "Document Tray", "Stapler"], price: [4, 79] },
  Cables: { code: "CAB", names: ["USB-C Hub", "HDMI Cable 2m", "Ethernet Cable 5m", "Power Strip 6-way", "Braided Charging Cable", "DisplayPort Adapter", "Cable Clips 20-pack"], price: [6, 69] },
  Displays: { code: "DSP", names: ['Portable Monitor 15"', 'Ultrawide Monitor 34"', "Monitor Light Bar", "Privacy Screen Filter", "Tablet Stand", "Digital Photo Frame", "Monitor Riser"], price: [24, 599] },
  Ergonomics: { code: "ERG", names: ["Footrest", "Wrist Rest Set", "Kneeling Chair", "Anti-fatigue Mat", "Lumbar Cushion", "Vertical Mouse", "Split Keyboard"], price: [15, 229] },
};

const FIRST_NAMES = ["Liam", "Olivia", "Noah", "Emma", "Elias", "Mia", "Lucas", "Amelia", "Mateo", "Zoe", "Hugo", "Lea", "Arjun", "Nora", "Kenji", "Ines", "Omar", "Freya", "Diego", "Hana", "Felix", "Chloe", "Ivan", "Sara", "Rafael", "Ella"];
const LAST_NAMES = ["Novak", "Okafor", "Bergström", "Rossi", "Haddad", "Kimura", "Dubois", "Petrov", "Silva", "Andersen", "Moreau", "Ivanova", "Schäfer"];
const COMPANY_A = ["Blue", "Granite", "Cedar", "Harbor", "Meridian", "Quartz", "Willow", "Summit", "Copper", "Lantern", "Pioneer", "Vantage", "Orbit"];
const COMPANY_B = ["Labs", "Studio", "Analytics", "Logistics", "Robotics", "Foods", "Media", "Works"];

const CHEAP_PRICE = 120;
const SPEND_CAP = 800;

function orderStatus(daysAgo: number, roll: number): OrderStatus {
  if (daysAgo > 30) return roll < 0.92 ? "delivered" : "cancelled";
  if (daysAgo > 8) return roll < 0.7 ? "delivered" : "shipped";
  if (daysAgo > 3) return roll < 0.6 ? "shipped" : "paid";
  return roll < 0.5 ? "pending" : "paid";
}

function generateStarter() {
  const random = makeRandom(20260902);
  const products = [...NAMED_PRODUCTS];
  for (const [category, { code, names, price }] of Object.entries(EXTRA_CATALOG)) {
    names.forEach((base, i) => {
      const basePrice = Math.round(price[0] + (price[1] - price[0]) * (i / (names.length - 1)));
      for (const [v, variant] of ["Classic", "Pro"].entries()) {
        products.push({
          name: `${base} ${variant}`,
          sku: `SKU-${code}-${String(i * 2 + v + 1).padStart(2, "0")}`,
          category,
          stock: 25 + Math.floor(random() * 376),
          price: v === 0 ? basePrice : Math.round(basePrice * 1.4),
        });
      }
    });
  }

  const customers = [...NAMED_CUSTOMERS];
  for (let i = 0; i < 100; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length) * 5) % LAST_NAMES.length];
    const company = `${COMPANY_A[i % COMPANY_A.length]} ${COMPANY_B[Math.floor(i / COMPANY_A.length)]}`;
    const domain = company.toLowerCase().replace(/\s+/g, "");
    customers.push({ name: `${first} ${last}`, company, email: `${first.toLowerCase()}@${domain}.com` });
  }

  const cheap = products.map((p, i) => (p.price <= CHEAP_PRICE ? i : -1)).filter((i) => i >= 0);
  const orders = [...NAMED_ORDERS];
  for (let ci = NAMED_CUSTOMERS.length; ci < customers.length; ci++) {
    let spend = 0;
    const attempts = 6 + Math.floor(random() * 8);
    for (let n = 0; n < attempts; n++) {
      const pi = cheap[Math.floor(random() * cheap.length)];
      const qty = 1 + Math.floor(random() * 4);
      const total = qty * products[pi].price;
      if (spend + total > SPEND_CAP) break;
      spend += total;
      const daysAgo = Math.floor(random() * 120);
      orders.push([ci, pi, qty, daysAgo, orderStatus(daysAgo, random())]);
    }
  }
  return { products, customers, orders };
}

const STARTER_SUPPLIERS = [...NAMED_SUPPLIERS, ...EXTRA_SUPPLIERS];
const { products: STARTER_PRODUCTS, customers: STARTER_CUSTOMERS, orders: STARTER_ORDERS } = generateStarter();

// Call once, at user creation.
export async function insertStarterData(userId: string): Promise<void> {
  const supplierRows = await db
    .insert(suppliers)
    .values(STARTER_SUPPLIERS.map((sup) => ({ ...sup, userId })))
    .returning({ id: suppliers.id, category: suppliers.category });
  // Every product category in STARTER_PRODUCTS has a supplier of that category.
  const supplierByCategory: Record<string, number> = Object.fromEntries(
    supplierRows.map((sup) => [sup.category, sup.id]),
  );

  const productRows = await db
    .insert(products)
    .values(
      STARTER_PRODUCTS.map((prod) => ({
        ...prod,
        userId,
        supplierId: supplierByCategory[prod.category],
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
        status,
        createdAt: day(daysAgo),
      };
    }),
  );

  // "received" batches are dated before the first sale, so each product sums to its stock.
  const firstSale = Math.max(...STARTER_ORDERS.map(([, , , daysAgo]) => daysAgo));
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
      createdAt: day(firstSale + 15),
    });
    if (totalIn - first > 0) {
      movements.push({
        userId,
        productId: productRows[pi].id,
        qty: totalIn - first,
        reason: "received",
        note: "Restock",
        createdAt: day(firstSale + 2),
      });
    }
  });
  await db.insert(stockMovements).values(movements);
}

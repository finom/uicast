import { faker } from "@faker-js/faker";
import { db, type NewProduct } from "./db";

const SEED_COUNT = 48;

function makeProducts(count: number): NewProduct[] {
  // Fixed seed: the same catalog on every machine.
  faker.seed(123);
  return Array.from({ length: count }, () => ({
    name: faker.commerce.productName(),
    sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
    // department() draws from a small set, so categories repeat and the by-category chart has bars.
    category: faker.commerce.department(),
    stock: faker.number.int({ min: 0, max: 240 }),
    price: Number(faker.commerce.price({ min: 5, max: 900 })),
  }));
}

const seedProducts: NewProduct[] = makeProducts(SEED_COUNT);

// One transaction, so StrictMode's second, concurrent call sees the first call's rows.
export async function seedIfEmpty(): Promise<void> {
  await db.transaction("rw", db.products, async () => {
    if ((await db.products.count()) === 0) await db.products.bulkAdd(seedProducts);
  });
}

export async function resetInventory(): Promise<void> {
  await db.products.clear();
  await db.products.bulkAdd(seedProducts);
}

import { faker } from "@faker-js/faker";
import { db, type NewProduct } from "./db";

const SEED_COUNT = 48;

function makeProducts(count: number): NewProduct[] {
  // Fixed seed → the same catalog on every machine, so the data sample embedded
  // in the demo prompt (see src/demo/inventory.prompt.ts) always matches the
  // rows that actually land in the database.
  faker.seed(123);
  return Array.from({ length: count }, () => ({
    name: faker.commerce.productName(),
    sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
    // department() draws from a small fixed set, so categories repeat — which
    // is what makes the "stock by category" breakdown chart meaningful.
    category: faker.commerce.department(),
    stock: faker.number.int({ min: 0, max: 240 }),
    price: Number(faker.commerce.price({ min: 5, max: 900 })),
  }));
}

/** The deterministic seed set — also imported by the prompt to show a sample. */
export const seedProducts: NewProduct[] = makeProducts(SEED_COUNT);

/** Populate the table on first run; a no-op once it has rows (data persists). */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.products.count();
  if (count > 0) return;
  await db.products.bulkAdd(seedProducts);
}

/** Wipe + reseed to the deterministic set — backs the demo's Replay button. */
export async function resetInventory(): Promise<void> {
  await db.products.clear();
  await db.products.bulkAdd(seedProducts);
}

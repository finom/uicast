import Dexie, { type EntityTable } from "dexie";

/**
 * The one persisted entity behind the demo. A browser-local IndexedDB table
 * (via Dexie) standing in for whatever remote data source a real generated app
 * would talk to — so the demo is fully self-contained and offline.
 */
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
}

/** Shape for inserts — `id` is auto-incremented by Dexie. */
export type NewProduct = Omit<Product, "id">;

const db = new Dexie("uicast-inventory") as Dexie & {
  products: EntityTable<Product, "id">;
};

db.version(1).stores({
  // ++id = auto-increment primary key; the rest are secondary indexes used by
  // the read functions (filtering, category aggregation).
  products: "++id, name, sku, category, stock, price",
});

export { db };

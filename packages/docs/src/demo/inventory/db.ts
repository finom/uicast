import Dexie, { type EntityTable } from "dexie";

// Stands in for a remote data source.
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
}

export type NewProduct = Omit<Product, "id">;

const db = new Dexie("uicast-inventory") as Dexie & {
  products: EntityTable<Product, "id">;
};

db.version(1).stores({
  products: "++id, name, sku, category, stock, price",
});

export { db };

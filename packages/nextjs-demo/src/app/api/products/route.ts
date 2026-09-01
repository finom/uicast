import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { productInsert } from "@/db/zod";
import { json, ownerForRead, readValid, requireUser } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(await db.select({ id: products.id, supplierId: products.supplierId, name: products.name, sku: products.sku, category: products.category, stock: products.stock, price: products.price }).from(products).where(eq(products.userId, read.owner.id)));
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, productInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(products)
    .values({ ...body.data, userId: auth.me.id })
    .returning({ id: products.id, supplierId: products.supplierId, name: products.name, sku: products.sku, category: products.category, stock: products.stock, price: products.price });
  return json(row, 201);
}

import { count, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { sumOf } from "@/db/query";
import { products } from "@/db/schema";
import { stockSummaryInput } from "@/db/zod";
import { json, ownerForRead, readQuery } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, stockSummaryInput);
  if ("error" in input) return input.error;
  const mine = eq(products.userId, read.owner.id);
  const value = sumOf(sql`${products.stock} * ${products.price}`);
  const [[totals], byCategory, bySupplier] = await Promise.all([
    db
      .select({
        products: count(),
        units: sumOf(products.stock),
        value,
        lowStock: count(sql`case when ${products.stock} <= ${input.data.lowStockAtMost} then 1 end`),
      })
      .from(products)
      .where(mine),
    db
      .select({ category: products.category, products: count(), units: sumOf(products.stock), value })
      .from(products)
      .where(mine)
      .groupBy(products.category)
      .orderBy(desc(value)),
    db
      .select({ supplierId: products.supplierId, products: count(), units: sumOf(products.stock), value })
      .from(products)
      .where(mine)
      .groupBy(products.supplierId)
      .orderBy(desc(value)),
  ]);
  return json({ ...totals, byCategory, bySupplier });
}

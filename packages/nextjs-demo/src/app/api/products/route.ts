import { and, asc, count, desc, eq, lte, or } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contains, publicColumns } from "@/db/query";
import { products } from "@/db/schema";
import { productInsert, productListInput } from "@/db/zod";
import { json, ownerForRead, readQuery, readValid, requireUser } from "@/lib/api";

const COLS = publicColumns(products);

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, productListInput);
  if ("error" in input) return input.error;
  const { limit, offset, sort, order, q, category, supplierId, stockAtMost } = input.data;
  const dir = order === "asc" ? asc : desc;
  const where = and(
    eq(products.userId, read.owner.id),
    q ? or(contains(products.name, q), contains(products.sku, q)) : undefined,
    category ? eq(products.category, category) : undefined,
    supplierId !== undefined ? eq(products.supplierId, supplierId) : undefined,
    stockAtMost !== undefined ? lte(products.stock, stockAtMost) : undefined,
  );
  const [items, [{ total }]] = await Promise.all([
    db
      .select(COLS)
      .from(products)
      .where(where)
      .orderBy((row) => [dir(row[sort]), dir(row.id)])
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return json({ items, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, productInsert);
  if ("error" in body) return body.error;
  const [row] = await db
    .insert(products)
    .values({ ...body.data, userId: auth.me.id })
    .returning(COLS);
  return json(row, 201);
}

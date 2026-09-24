import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contains, publicColumns } from "@/db/query";
import { products, stockMovements } from "@/db/schema";
import { movementInsert, movementListInput } from "@/db/zod";
import { json, ownerForRead, readQuery, readValid, requireUser } from "@/lib/api";

const COLS = publicColumns(stockMovements);

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, movementListInput);
  if ("error" in input) return input.error;
  const { limit, offset, sort, order, q, productId, reason } = input.data;
  const dir = order === "asc" ? asc : desc;
  const where = and(
    eq(stockMovements.userId, read.owner.id),
    q ? contains(products.name, q) : undefined,
    productId !== undefined ? eq(stockMovements.productId, productId) : undefined,
    reason ? eq(stockMovements.reason, reason) : undefined,
  );
  const [items, [{ total }]] = await Promise.all([
    db
      .select({ ...COLS, productName: products.name })
      .from(stockMovements)
      .innerJoin(products, eq(products.id, stockMovements.productId))
      .where(where)
      .orderBy((row) => [dir(row[sort]), dir(row.id)])
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(stockMovements).innerJoin(products, eq(products.id, stockMovements.productId)).where(where),
  ]);
  return json({ items, total, limit, offset });
}

// The stock adjustment rides the same transaction, so the ledger and the counter cannot drift apart.
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, movementInsert);
  if ("error" in body) return body.error;
  const { productId, qty } = body.data;
  if (qty === 0) return json({ error: "qty must not be zero" }, 400);

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.userId, auth.me.id)))
      .for("update");
    if (!product) return { error: json({ error: "productId does not exist" }, 400) };
    if (product.stock + qty < 0) {
      return { error: json({ error: `Only ${product.stock} in stock — cannot remove ${Math.abs(qty)}` }, 409) };
    }
    await tx.update(products).set({ stock: sql`${products.stock} + ${qty}` }).where(eq(products.id, productId));
    const [row] = await tx.insert(stockMovements).values({ ...body.data, userId: auth.me.id }).returning(COLS);
    return { row };
  });
  if ("error" in result) return result.error;
  return json(result.row, 201);
}

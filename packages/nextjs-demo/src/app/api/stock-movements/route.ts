import { and, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { movementInsert } from "@/db/zod";
import { json, ownerForRead, readValid, requireUser } from "@/lib/api";

const COLS = {
  id: stockMovements.id,
  productId: stockMovements.productId,
  qty: stockMovements.qty,
  reason: stockMovements.reason,
  note: stockMovements.note,
  createdAt: stockMovements.createdAt,
};

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  return json(
    await db
      .select(COLS)
      .from(stockMovements)
      .where(eq(stockMovements.userId, read.owner.id))
      .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id)),
  );
}

// A movement adjusts the product's stock in the same transaction, so the
// ledger and the counter cannot drift apart.
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
      .where(and(eq(products.id, productId), eq(products.userId, auth.me.id)));
    if (!product) return { error: json({ error: "productId does not exist" }, 400) };
    if (product.stock + qty < 0) {
      return {
        error: json(
          { error: `Only ${product.stock} in stock — cannot remove ${Math.abs(qty)}` },
          409,
        ),
      };
    }
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${qty}` })
      .where(eq(products.id, productId));
    const [row] = await tx
      .insert(stockMovements)
      .values({ ...body.data, userId: auth.me.id })
      .returning(COLS);
    return { row };
  });
  if ("error" in result) return result.error;
  return json(result.row, 201);
}

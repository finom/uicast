import { and, asc, count, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contains, publicColumns } from "@/db/query";
import { suppliers } from "@/db/schema";
import { supplierInsert, supplierListInput } from "@/db/zod";
import { json, ownerForRead, readQuery, readValid, requireUser } from "@/lib/api";

const COLS = publicColumns(suppliers);

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, supplierListInput);
  if ("error" in input) return input.error;
  const { limit, offset, sort, order, q, category } = input.data;
  const dir = order === "asc" ? asc : desc;
  const where = and(
    eq(suppliers.userId, read.owner.id),
    q ? contains(suppliers.name, q) : undefined,
    category ? eq(suppliers.category, category) : undefined,
  );
  const [items, [{ total }]] = await Promise.all([
    db
      .select(COLS)
      .from(suppliers)
      .where(where)
      .orderBy((row) => [dir(row[sort]), dir(row.id)])
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(suppliers).where(where),
  ]);
  return json({ items, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await readValid(req, supplierInsert);
  if ("error" in body) return body.error;
  const [row] = await db.insert(suppliers).values({ ...body.data, userId: auth.me.id }).returning(COLS);
  return json(row, 201);
}

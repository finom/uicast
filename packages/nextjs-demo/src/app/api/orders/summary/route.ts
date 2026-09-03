import { and, count, countDistinct, eq, gte, ne, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { sumOf } from "@/db/query";
import { orders } from "@/db/schema";
import { salesSummaryInput } from "@/db/zod";
import { json, ownerForRead, readQuery } from "@/lib/api";

export async function GET(req: NextRequest) {
  const read = await ownerForRead(req);
  if ("error" in read) return read.error;
  const input = readQuery(req, salesSummaryInput);
  if ("error" in input) return input.error;
  const since = new Date(Date.now() - input.data.days * 86_400_000);
  const mine = eq(orders.userId, read.owner.id);
  const inWindow = and(mine, ne(orders.status, "cancelled"), gte(orders.createdAt, since));
  const day = sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`;
  const [[totals], byStatus, byDay] = await Promise.all([
    db
      .select({ count: count(), revenue: sumOf(orders.total), customers: countDistinct(orders.customerId) })
      .from(orders)
      .where(inWindow),
    db.select({ status: orders.status, count: count() }).from(orders).where(mine).groupBy(orders.status),
    db
      .select({ date: day, revenue: sumOf(orders.total), orders: count() })
      .from(orders)
      .where(inWindow)
      .groupBy(day)
      .orderBy(day),
  ]);
  const avgOrder = totals.count ? Math.round((totals.revenue / totals.count) * 100) / 100 : 0;
  return json({ ...totals, avgOrder, byStatus, byDay });
}

import { buildElementsById, type ComponentEntry } from "@uicast/core";
import { asc, eq, inArray } from "drizzle-orm";
import { HttpException, HttpStatus } from "vovk";
import { db } from "@/db";
import { componentEntries, pages } from "@/db/schema";

export default class GenerationService {
  static getPage = async (pageId: number) => {
    const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
    if (!page) throw new HttpException(HttpStatus.NOT_FOUND, "Page not found");
    return page;
  };

  static getEntries = async (pageId: number): Promise<ComponentEntry[]> => {
    const rows = await db
      .select({ data: componentEntries.data })
      .from(componentEntries)
      .where(eq(componentEntries.pageId, pageId))
      .orderBy(asc(componentEntries.id));
    return rows.map((row) => row.data as ComponentEntry);
  };

  static appendEntry = async (pageId: number, data: ComponentEntry) => {
    await db.insert(componentEntries).values({ pageId, data });
  };

  /**
   * Keep only the current tree. A re-emitted key shadows its old row and the
   * subtree it replaced at render time (`buildElementsById`); here the shadowed
   * rows are physically dropped so storage matches what renders.
   */
  static pruneShadowedEntries = async (pageId: number) => {
    const stored = await db
      .select({ id: componentEntries.id, data: componentEntries.data })
      .from(componentEntries)
      .where(eq(componentEntries.pageId, pageId))
      .orderBy(asc(componentEntries.id));

    const current = buildElementsById(stored.map((row) => row.data as ComponentEntry));
    const lastIdByKey = new Map<string, number>();
    for (const row of stored) lastIdByKey.set((row.data as ComponentEntry).key, row.id);
    const keep = new Set(Object.keys(current).map((key) => lastIdByKey.get(key)));
    const stale = stored.map((row) => row.id).filter((id) => !keep.has(id));
    if (stale.length) {
      await db.delete(componentEntries).where(inArray(componentEntries.id, stale));
    }
  };
}

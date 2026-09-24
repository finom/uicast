import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chats, pages } from "@/db/schema";
import { getSessionUser, getUserBySlug } from "@/lib/auth";
import { SYSTEM_SLUG } from "@/lib/system-slug";

// The sidebar's lists, as `/api/pages` and `/api/chats` return them: the session user's, else the demo account's.
export async function loadSidebar() {
  const me = await getSessionUser();
  const owner = me ?? (await getUserBySlug(SYSTEM_SLUG));
  if (!owner) return { me: null, pages: [], chats: [] };
  const [ownerPages, ownerChats] = await Promise.all([
    db
      .select({ id: pages.id, seedId: pages.seedId, title: pages.title })
      .from(pages)
      .where(eq(pages.userId, owner.id))
      .orderBy(pages.id),
    db
      .select({ id: chats.id, title: chats.title })
      .from(chats)
      .where(eq(chats.userId, owner.id))
      .orderBy(desc(chats.createdAt)),
  ]);
  return { me: me ? { slug: me.slug } : null, pages: ownerPages, chats: ownerChats };
}

export type SidebarData = Awaited<ReturnType<typeof loadSidebar>>;

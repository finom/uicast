import { desc, eq } from "drizzle-orm";
import { FileText, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { LinkGrid } from "@/components/link-grid";
import { db } from "@/db";
import { chats, pages } from "@/db/schema";
import { getSessionUser, getUserBySlug } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UserIndex({ params }: PageProps<"/u/[slug]">) {
  const { slug } = await params;
  const user = await getUserBySlug(slug);
  if (!user) notFound();
  const me = await getSessionUser();
  const mine = me?.id === user.id;

  const [userPages, userChats] = await Promise.all([
    db.select().from(pages).where(eq(pages.userId, user.id)).orderBy(desc(pages.createdAt)),
    db.select().from(chats).where(eq(chats.userId, user.id)).orderBy(desc(chats.createdAt)),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-baseline gap-2">
        <h1 className="text-lg font-semibold">@{slug}</h1>
        <span className="text-xs text-muted-foreground">{mine ? "your workspace" : "read-only"}</span>
      </header>

      <LinkGrid
        title="Pages"
        icon={FileText}
        empty="No pages yet."
        items={userPages.map((page) => ({ key: page.id, href: `/u/${slug}/p/${page.seedId ?? page.id}`, title: page.title }))}
      />
      <LinkGrid
        title="Chats"
        icon={MessageSquare}
        empty="No chats yet."
        items={userChats.map((chat) => ({ key: chat.id, href: `/u/${slug}/c/${chat.id}`, title: chat.title }))}
      />
    </div>
  );
}

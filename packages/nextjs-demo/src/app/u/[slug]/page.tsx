import { desc, eq } from "drizzle-orm";
import { FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
        <span className="text-xs text-muted-foreground">
          {mine ? "your workspace" : "read-only"}
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Pages</h2>
        {userPages.length === 0 && <p className="text-sm text-muted-foreground">No pages yet.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {userPages.map((page) => (
            <Link
              key={page.id}
              href={`/u/${slug}/p/${page.seedId ?? page.id}`}
              className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{page.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Chats</h2>
        {userChats.length === 0 && <p className="text-sm text-muted-foreground">No chats yet.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {userChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/u/${slug}/c/${chat.id}`}
              className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{chat.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

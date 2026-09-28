import type { UIMessage } from "ai";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { chatMessages, chats, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { pickChatSuggestions } from "@/lib/suggestions";
import { ChatView } from "@/components/chat-view";
import type { Usage } from "@/components/cost-info";

export const dynamic = "force-dynamic";

export default async function UserChat({ params }: PageProps<"/u/[slug]/c/[id]">) {
  const { slug, id } = await params;
  const [row] = await db
    .select({ chat: chats })
    .from(chats)
    .innerJoin(users, eq(chats.userId, users.id))
    .where(and(eq(chats.id, id), eq(users.slug, slug)));
  const me = await getSessionUser();
  // The row appears with the first message; until then only its owner sees it.
  if (!row) {
    if (me?.slug !== slug) notFound();
    return <ChatView chatId={id} ownerSlug={slug} suggestions={pickChatSuggestions()} />;
  }

  const rows = await db.select().from(chatMessages).where(eq(chatMessages.chatId, id)).orderBy(asc(chatMessages.id));

  const initialMessages = rows.map((r) => ({
    id: r.messageId,
    role: r.role,
    parts: r.parts,
    metadata: r.metadata ? { ...(r.metadata as object), model: r.model } : undefined,
  })) as UIMessage<Usage>[];

  return (
    <ChatView chatId={id} initialMessages={initialMessages} ownerSlug={slug} readonly={me?.id !== row.chat.userId} />
  );
}

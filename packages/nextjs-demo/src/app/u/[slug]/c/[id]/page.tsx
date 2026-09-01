import type { UIMessage } from "ai";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { chatMessages, chats, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ChatView } from "@/components/chat-view";

export const dynamic = "force-dynamic";

export default async function UserChat({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const [row] = await db
    .select({ chat: chats })
    .from(chats)
    .innerJoin(users, eq(chats.userId, users.id))
    .where(and(eq(chats.id, id), eq(users.slug, slug)));
  if (!row) notFound();
  const me = await getSessionUser();

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, id))
    .orderBy(asc(chatMessages.id));

  const initialMessages = rows.map((r) => ({
    id: r.messageId,
    role: r.role,
    parts: r.parts,
    metadata: r.metadata ?? undefined,
  })) as UIMessage[];

  return (
    <ChatView
      chatId={id}
      initialMessages={initialMessages}
      ownerSlug={slug}
      readonly={me?.id !== row.chat.userId}
    />
  );
}

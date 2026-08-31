import type { UIMessage } from "ai";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { ChatView } from "@/components/chat-view";

// Messages change with every exchange — never serve a static snapshot.
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // No notFound() for an unknown id: a freshly minted chat can be reloaded
  // before its first message lands — it starts empty.
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, id))
    .orderBy(asc(chatMessages.id));

  const initialMessages = rows.map((row) => ({
    id: row.messageId,
    role: row.role,
    parts: row.parts,
  })) as UIMessage[];

  return <ChatView chatId={id} initialMessages={initialMessages} />;
}

import type { UIMessage } from "ai";
import { ChatView } from "@/components/chat-view";
import { read } from "@/store";

// Messages change with every exchange — never serve a static snapshot.
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // No notFound() for an unknown id: a freshly minted chat can be reloaded
  // before its first message lands — it simply starts empty.
  const initialMessages = read()
    .messages.filter((message) => message.chatId === id)
    .sort((a, b) => a.id - b.id)
    .map((row) => ({
      id: row.messageId,
      role: row.role,
      parts: row.parts,
    })) as UIMessage[];

  return <ChatView chatId={id} initialMessages={initialMessages} />;
}

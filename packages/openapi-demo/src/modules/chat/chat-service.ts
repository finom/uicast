import { asc, desc, eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { db } from "@/db";
import { chatMessages, chats } from "@/db/schema";

export default class ChatService {
  static getChats = async () => {
    const rows = await db.select().from(chats).orderBy(desc(chats.createdAt));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    }));
  };

  static getMessages = async (chatId: string): Promise<UIMessage[]> => {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(asc(chatMessages.id));
    return rows.map((row) => ({
      id: row.messageId,
      role: row.role,
      parts: row.parts,
    })) as UIMessage[];
  };

  /** The chat row is created lazily by the first message; the client mints the id. */
  static ensureChat = async (id: string, title: string) => {
    await db.insert(chats).values({ id, title }).onConflictDoNothing();
  };

  /**
   * Replace-all persistence: the incoming array is the client's full message
   * list, so mirroring it wholesale is simpler and self-healing. Delete and
   * reinsert ride one transaction so a failed insert cannot empty the chat.
   */
  static persistMessages = (chatId: string, messages: UIMessage[]) => {
    db.transaction((tx) => {
      tx.delete(chatMessages).where(eq(chatMessages.chatId, chatId)).run();
      if (messages.length === 0) return;
      tx.insert(chatMessages)
        .values(
          messages.map((message) => ({
            chatId,
            messageId: message.id,
            role: message.role,
            parts: message.parts,
          })),
        )
        .run();
    });
  };
}

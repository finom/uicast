"use client";

import { useState } from "react";
import { ChatView } from "@/components/chat-view";

// Ephemeral like ChatGPT: the chat row is created by the first message; until
// then this page is just a fresh ChatView under a client-minted id. The URL
// swaps to /chats/[id] shallowly on the first send.
export function NewChat() {
  const [chatId] = useState(() => crypto.randomUUID());
  return <ChatView chatId={chatId} replaceUrlOnFirstSend />;
}

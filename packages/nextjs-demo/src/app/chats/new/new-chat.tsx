"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChatView } from "@/components/chat-view";

// Ephemeral like ChatGPT: the chat row is created by the first message; until
// then this page is just a fresh ChatView under a client-minted id. The URL
// swaps to the chat's own address shallowly on the first send.
export function NewChat() {
  const [chatId] = useState(() => crypto.randomUUID());
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<{ slug: string } | null> => {
      const res = await fetch("/api/auth/me");
      return res.ok ? res.json() : null;
    },
  });
  // Only a signed-in visitor can create a chat, so only they get the URL swap.
  return <ChatView chatId={chatId} ownerSlug={me?.slug ?? null} replaceUrlOnFirstSend={Boolean(me)} />;
}

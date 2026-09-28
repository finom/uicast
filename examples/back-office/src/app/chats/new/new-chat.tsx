"use client";

import { useState } from "react";
import { ChatView } from "@/components/chat-view";

export function NewChat({ slug, suggestions }: { slug: string; suggestions: string[] }) {
  const [chatId] = useState(() => crypto.randomUUID());
  return <ChatView chatId={chatId} ownerSlug={slug} suggestions={suggestions} />;
}

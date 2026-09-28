"use client";

import { useState } from "react";
import { ChatView } from "@/components/chat-view";
import { SYSTEM_SLUG } from "@/lib/system-slug";

// Logged out, the empty chat shows but cannot send.
export function NewChat({ slug }: { slug: string | null }) {
  const [chatId] = useState(() => crypto.randomUUID());
  return <ChatView chatId={chatId} ownerSlug={slug ?? SYSTEM_SLUG} loggedOut={!slug} />;
}

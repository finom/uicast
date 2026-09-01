import { getSessionUser } from "@/lib/auth";
import { LoginGate } from "@/components/login-gate";
import { NewChat } from "./new-chat";

export const dynamic = "force-dynamic";

export default async function NewChatPage() {
  const me = await getSessionUser();
  if (!me) return <LoginGate what="start chats" />;
  return <NewChat />;
}

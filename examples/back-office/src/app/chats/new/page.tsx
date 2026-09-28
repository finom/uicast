import { getSessionUser } from "@/lib/auth";
import { NewChat } from "./new-chat";

export const dynamic = "force-dynamic";

export default async function NewChatPage() {
  const me = await getSessionUser();
  return <NewChat slug={me?.slug ?? null} />;
}

import { getSessionUser } from "@/lib/auth";
import { NewChat } from "./new-chat";

export const dynamic = "force-dynamic";

export default async function NewChatPage({ searchParams }: PageProps<"/chats/new">) {
  const me = await getSessionUser();
  const { login } = await searchParams;
  return <NewChat slug={me?.slug ?? null} loginFailed={login === "failed"} />;
}

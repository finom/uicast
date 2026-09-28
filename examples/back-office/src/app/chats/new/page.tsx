import { LoginGate } from "@/components/login-gate";
import { getSessionUser } from "@/lib/auth";
import { pickChatSuggestions } from "@/lib/suggestions";
import { NewChat } from "./new-chat";

export const dynamic = "force-dynamic";

export default async function NewChatPage({ searchParams }: PageProps<"/chats/new">) {
  const me = await getSessionUser();
  if (me) return <NewChat slug={me.slug} suggestions={pickChatSuggestions()} />;
  const { login } = await searchParams;
  return (
    <LoginGate
      title="Log in to start chats"
      description="Generations run on your own OpenRouter credits, over a private copy of the demo data."
    >
      {login === "failed" && (
        <p role="alert" className="text-xs text-destructive">
          OpenRouter login failed or was cancelled. Try again.
        </p>
      )}
    </LoginGate>
  );
}

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { chats, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ChatView } from "@/components/chat-view";

export const dynamic = "force-dynamic";

// Legacy path. A chat row may not exist yet (fresh id, first message pending)
// — in that case render the live view for its owner-to-be.
export default async function LegacyChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ slug: users.slug })
    .from(chats)
    .innerJoin(users, eq(chats.userId, users.id))
    .where(eq(chats.id, id));
  if (row) redirect(`/u/${row.slug}/c/${id}`);
  const me = await getSessionUser();
  return <ChatView chatId={id} ownerSlug={me?.slug ?? null} readonly={!me} />;
}

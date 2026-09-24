import { desc, eq } from "drizzle-orm";
import { FileText, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { db } from "@/db";
import { chats, pages, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { SYSTEM_SLUG } from "@/lib/system-slug";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ login?: string | string[] }>;
}) {
  const { login } = await searchParams;
  const me = await getSessionUser();
  const [recentPages, recentChats] = await Promise.all([
    db
      .select({ id: pages.id, seedId: pages.seedId, title: pages.title, slug: users.slug })
      .from(pages)
      .innerJoin(users, eq(pages.userId, users.id))
      .orderBy(desc(pages.createdAt))
      .limit(12),
    db
      .select({ id: chats.id, title: chats.title, slug: users.slug })
      .from(chats)
      .innerJoin(users, eq(chats.userId, users.id))
      .orderBy(desc(chats.createdAt))
      .limit(8),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-3 pt-6 text-center">
        <h1 className="text-2xl font-semibold">Apps and answers, generated live</h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Describe a page or ask a question — the model builds working UI over a demo
          database of customers, orders, and products. Everything anyone builds here is
          public and read-only for others; log in with OpenRouter to build on your own
          copy of the data, billed to your own credits.
        </p>
        <div className="flex justify-center gap-2">
          {me ? (
            <>
              <Button asChild>
                <Link href="/pages/new">
                  <Sparkles data-icon="inline-start" />
                  Create a page
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/chats/new">New chat</Link>
              </Button>
            </>
          ) : (
            <Button asChild>
              <a href="/api/auth/login">Log in with OpenRouter</a>
            </Button>
          )}
        </div>
        {login === "failed" && (
          <p role="alert" className="text-xs text-destructive">
            OpenRouter login failed or was cancelled. Try again.
          </p>
        )}
        {!me && (
          <p className="text-xs text-muted-foreground">
            No account here — OpenRouter authorizes a key, and generations bill your own
            credits. Start by browsing{" "}
            <Link className="underline" href={`/u/${SYSTEM_SLUG}`}>
              the demo content
            </Link>
            .
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Recent pages</h2>
        {recentPages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing here yet — seed the database.</p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {recentPages.map((page) => (
            <Link
              key={page.id}
              href={`/u/${page.slug}/p/${page.seedId ?? page.id}`}
              className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{page.title}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">@{page.slug}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Recent chats</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {recentChats.map((chat) => (
            <Link
              key={chat.id}
              href={`/u/${chat.slug}/c/${chat.id}`}
              className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{chat.title}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">@{chat.slug}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

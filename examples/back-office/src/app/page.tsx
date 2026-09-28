import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ login?: string | string[] }> }) {
  const me = await getSessionUser();
  if (me) {
    const [latest] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.userId, me.id))
      .orderBy(desc(chats.createdAt))
      .limit(1);
    redirect(latest ? `/u/${me.slug}/c/${latest.id}` : "/chats/new");
  }
  const { login } = await searchParams;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Warehouse back office</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Describe a page or ask a question. The model answers with working UI over the store's demo data, billed to your
        own OpenRouter credits.
      </p>
      <Button asChild className="h-11 px-6 text-base">
        <a href="/api/auth/login">Log in with OpenRouter</a>
      </Button>
      {login === "failed" && (
        <p role="alert" className="text-xs text-destructive">
          OpenRouter login failed or was cancelled. Try again.
        </p>
      )}
      <nav className="flex gap-4 text-sm text-muted-foreground">
        <a
          className="underline-offset-4 hover:text-foreground hover:underline"
          href="https://uicast.dev"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
        <a
          className="underline-offset-4 hover:text-foreground hover:underline"
          href="https://github.com/finom/uicast"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>
    </div>
  );
}

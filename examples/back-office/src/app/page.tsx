import Link from "next/link";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ login?: string | string[] }> }) {
  const { login } = await searchParams;
  const me = await getSessionUser();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Warehouse back office</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Describe a page or ask a question. The model answers with working UI over the store's demo data, billed to your
        own OpenRouter credits.
      </p>
      <div className="flex gap-2">
        {me ? (
          <>
            <Button asChild className="h-11 px-6 text-base">
              <Link href="/pages/new">New page</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6 text-base">
              <Link href="/chats/new">New chat</Link>
            </Button>
          </>
        ) : (
          <Button asChild className="h-11 px-6 text-base">
            <a href="/api/auth/login">Log in with OpenRouter</a>
          </Button>
        )}
      </div>
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

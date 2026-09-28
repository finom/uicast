import { redirect } from "next/navigation";
import { LoginGate } from "@/components/login-gate";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ login?: string | string[] }> }) {
  if (await getSessionUser()) redirect("/chats/new");
  const { login } = await searchParams;

  return (
    <LoginGate
      title="Warehouse back office"
      description="Describe a page or ask a question. The model answers with working UI over the store's demo data, billed to your own OpenRouter credits."
    >
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
    </LoginGate>
  );
}

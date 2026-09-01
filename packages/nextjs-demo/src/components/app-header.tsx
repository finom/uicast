import { Boxes, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { getSessionUser } from "@/lib/auth";
import { MobileNav } from "./mobile-nav";

export async function AppHeader() {
  const me = await getSessionUser();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
      <MobileNav />
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </span>
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-sm font-semibold">Warehouse</span>
          <span className="text-xs text-muted-foreground">
            uicast demo — pages &amp; chats generated over a live database
          </span>
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <a href="https://uicast.dev" target="_blank" rel="noreferrer">
            Built with uicast
          </a>
        </Button>
        {me ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/u/${me.slug}`}>@{me.slug}</Link>
            </Button>
            <form action="/api/auth/logout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </>
        ) : (
          <Button asChild size="sm">
            <a href="/api/auth/login">
              <LogIn data-icon="inline-start" />
              Log in with OpenRouter
            </a>
          </Button>
        )}
      </div>
    </header>
  );
}

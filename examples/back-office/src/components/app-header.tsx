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
        <Button asChild variant="ghost" size="icon-sm">
          <a href="https://github.com/finom/uicast" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor" role="img">
              <title>Source on GitHub</title>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
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

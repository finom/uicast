import Image from "next/image";
import Link from "next/link";
import { GitHubIcon } from "nextra/icons";

// The `h1` is real markup for the outline; `clear-both` keeps the block clear of Nextra's floated "Copy page" control.
export function Hero() {
  return (
    <div className="clear-both mb-12 flex flex-col items-center gap-4 border-b pb-12 pt-6 text-center">
      <Image src="/uicast-logo.svg" alt="" width={64} height={64} className="dark:hidden" />
      <Image src="/uicast-logo-dark.svg" alt="" width={64} height={64} className="hidden dark:block" />
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">uicast</h1>
      <p className="text-balance text-lg font-medium text-muted-foreground sm:text-xl">
        The expression-driven generative UI framework
      </p>
      <div className="mt-4 flex flex-col gap-3 self-stretch sm:flex-row sm:justify-center sm:self-auto">
        <Link
          href="/getting-started"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <a
          href="https://github.com/finom/uicast"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          <GitHubIcon height="16" />
          GitHub
        </a>
      </div>
    </div>
  );
}

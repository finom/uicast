import Link from "next/link";
import { GitHubIcon } from "nextra/icons";
import { BetaBadge } from "./beta-badge";

/**
 * The docs index doubles as the front door, so its first screen is a hero
 * rather than a page heading. The `h1` stays real markup — the document
 * outline reads it; the page `<title>` comes from the file's frontmatter.
 * `clear-both` keeps the centered block clear of Nextra's floated "Copy page"
 * control, which is laid out above it.
 */
export function Hero() {
  return (
    <div className="clear-both mb-12 flex flex-col items-center gap-4 border-b pb-12 pt-6 text-center">
      <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl font-bold tracking-tight sm:text-6xl">
        uicast
        <BetaBadge />
      </h1>
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

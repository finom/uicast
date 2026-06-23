import Link from "next/link";
import { demoManifest } from "@/demo/manifest";
import { ThemeToggle } from "./theme-toggle";

export default function Home() {
  return (
    <main className="relative mx-auto max-w-4xl px-6 py-16">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <header className="space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          ui-fired · live reference
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Watch generated apps assemble
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Each demo streams JSONLines that the engine renders with real catalog
          components and live data functions — then you use the app for real.
          Pick one to watch it build, one entry at a time.
        </p>
      </header>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {demoManifest.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/demo/${d.slug}`}
              className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
            >
              <h2 className="font-semibold">{d.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">
                {d.tagline}
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

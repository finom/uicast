import { FileText, LogIn, MessageSquare, PanelLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@uicast/shadcn-catalog/ui/button";

const PARTS = [
  {
    icon: MessageSquare,
    title: "Chats",
    text: "Ask a question or give a task. The answer comes back as a working UI: a table, a chart, a form.",
  },
  {
    icon: FileText,
    title: "Pages",
    text: "Describe a screen and save it. It reads the live data each time you open it.",
  },
  {
    icon: PanelLeft,
    title: "Examples",
    text: "The pages and chats in the sidebar were made the same way. They open without logging in.",
  },
];

export function LoginGate({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6">
      <section className="flex max-w-2xl flex-col items-center gap-3 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">A uicast demo</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          A warehouse back office with no screens written
        </h1>
        <p className="text-balance text-muted-foreground">
          Products, stock, orders, customers and suppliers in a live database. You describe the screen you need; the
          model builds it from a component catalog and calls the warehouse&apos;s functions.
        </p>
      </section>

      <ul className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {PARTS.map(({ icon: Icon, title: name, text }) => (
          <li key={name} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4" />
            </span>
            <span className="text-sm font-semibold">{name}</span>
            <span className="text-sm text-muted-foreground">{text}</span>
          </li>
        ))}
      </ul>

      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild className="h-11 px-6 text-base">
          <a href="/api/auth/login">
            <LogIn />
            Log in with OpenRouter
          </a>
        </Button>
        {children}
      </div>

      <p className="text-xs text-muted-foreground">
        How it works:{" "}
        <a className="underline hover:text-foreground" href="https://uicast.dev" target="_blank" rel="noreferrer">
          uicast.dev
        </a>{" "}
        ·{" "}
        <a
          className="underline hover:text-foreground"
          href="https://uicast.dev/example-app"
          target="_blank"
          rel="noreferrer"
        >
          run or deploy your own copy
        </a>
      </p>
    </div>
  );
}

import { Boxes } from "lucide-react";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-semibold">OpenAPI client</span>
          <span className="text-xs text-muted-foreground">uicast demo — UI over any OpenAPI API</span>
        </span>
      </Link>
    </header>
  );
}

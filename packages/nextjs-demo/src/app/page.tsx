import { LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@ui-fired/shadcn-catalog/ui/button";

export default function Home() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <LayoutDashboard className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">No page selected</h1>
          <p className="text-sm text-muted-foreground">
            Create a page and describe what you want to build. It'll show up in the sidebar.
          </p>
        </div>
        <Button asChild>
          <Link href="/pages/new">
            <Plus data-icon="inline-start" />
            Create page
          </Link>
        </Button>
      </div>
    </div>
  );
}

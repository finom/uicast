"use client";

import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@ui-fired/shadcn-catalog/ui/button";
import { ScrollArea } from "@ui-fired/shadcn-catalog/ui/scroll-area";
import { Separator } from "@ui-fired/shadcn-catalog/ui/separator";

type SidebarPage = { id: number; title: string };

export function AppSidebar() {
  const pathname = usePathname();
  const [pages, setPages] = useState<SidebarPage[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/pages")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SidebarPage[]) => {
        if (active) setPages(data);
      })
      .catch(() => active && setPages([]));
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-2 border-r bg-sidebar p-2 text-sidebar-foreground">
      <Button asChild className="w-full justify-start">
        <Link href="/pages/new">
          <Plus data-icon="inline-start" />
          Create page
        </Link>
      </Button>

      <Separator className="my-1" />

      <p className="px-2 text-xs font-medium text-muted-foreground">Pages</p>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 pr-2">
          {pages === null ? null : pages.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No pages yet. Create one to get started.
            </p>
          ) : (
            pages.map((page) => {
              const href = `/pages/${page.id}`;
              const active = pathname === href;
              return (
                <Button
                  key={page.id}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link href={href}>
                    <FileText data-icon="inline-start" />
                    <span className="truncate">{page.title}</span>
                  </Link>
                </Button>
              );
            })
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}

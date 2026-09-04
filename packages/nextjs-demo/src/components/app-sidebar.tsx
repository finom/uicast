"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { ScrollArea } from "@uicast/shadcn-catalog/ui/scroll-area";
import { Separator } from "@uicast/shadcn-catalog/ui/separator";

type SidebarPage = { id: number; title: string };
type SidebarChat = { id: string; title: string };

export function AppSidebar({ mobile = false }: { mobile?: boolean } = {}) {
  const pathname = usePathname();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<{ slug: string } | null> => {
      const res = await fetch("/api/auth/me");
      return res.ok ? res.json() : null;
    },
  });
  const slug = me?.slug ?? "uicast";
  const { data: pages } = useQuery({
    queryKey: ["pages"],
    queryFn: async (): Promise<SidebarPage[]> => {
      const res = await fetch("/api/pages");
      return res.ok ? res.json() : [];
    },
  });
  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: async (): Promise<SidebarChat[]> => {
      const res = await fetch("/api/chats");
      return res.ok ? res.json() : [];
    },
  });

  return (
    <aside className={`${mobile ? "flex w-full border-0" : "hidden w-64 border-r md:flex"} h-full shrink-0 flex-col gap-2 bg-sidebar p-2 text-sidebar-foreground`}>
      <Button asChild className="w-full justify-start">
        <Link href="/pages/new">
          <Plus data-icon="inline-start" />
          Create page
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full justify-start">
        <Link href="/chats/new">
          <Plus data-icon="inline-start" />
          New chat
        </Link>
      </Button>

      <Separator className="my-1" />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 pr-2">
          <p className="px-2 text-xs font-medium text-muted-foreground">{me ? "Your pages" : `@${slug} pages`}</p>
          <nav className="flex flex-col gap-1">
            {pages === undefined ? null : pages.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No pages yet. Create one to get started.
              </p>
            ) : (
              pages.map((page) => {
                const href = `/u/${slug}/p/${page.id}`;
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

          <p className="mt-3 px-2 text-xs font-medium text-muted-foreground">{me ? "Your chats" : `@${slug} chats`}</p>
          <nav className="flex flex-col gap-1">
            {chats === undefined ? null : chats.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No chats yet. Start one to ask about your data.
              </p>
            ) : (
              chats.map((chat) => {
                const href = `/u/${slug}/c/${chat.id}`;
                const active = pathname === href;
                return (
                  <Button
                    key={chat.id}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Link href={href}>
                      <MessageSquare data-icon="inline-start" />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </Button>
                );
              })
            )}
          </nav>
        </div>
      </ScrollArea>
    </aside>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, type LucideIcon, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import { ScrollArea } from "@uicast/shadcn-catalog/ui/scroll-area";
import { Separator } from "@uicast/shadcn-catalog/ui/separator";
import type { SidebarData } from "@/lib/sidebar";
import { SYSTEM_SLUG } from "@/lib/system-slug";
import { cn } from "@/lib/utils";

const getJson =
  <T,>(url: string, fallback: T) =>
  async (): Promise<T> => {
    const res = await fetch(url);
    return res.ok ? res.json() : fallback;
  };

type NavSectionProps = {
  label: string;
  empty: string;
  icon: LucideIcon;
  items?: { key: string | number; href: string; title: string }[];
  className?: string;
};

function NavSection({ label, empty, icon: Icon, items, className }: NavSectionProps) {
  const pathname = usePathname();
  return (
    <>
      <p className={cn(className, "px-2 text-xs font-medium text-muted-foreground")}>{label}</p>
      <nav className="flex flex-col gap-1">
        {items?.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted-foreground">{empty}</p>}
        {items?.map(({ key, href, title }) => (
          <Button
            key={key}
            asChild
            variant={pathname === href ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
          >
            <Link href={href}>
              <Icon data-icon="inline-start" />
              <span className="truncate">{title}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </>
  );
}

// `initial` comes from the server pass, so the first HTML has the lists; the queries keep them current.
export function AppSidebar({ mobile = false, initial }: { mobile?: boolean; initial?: SidebarData }) {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getJson<SidebarData["me"]>("/api/auth/me", null),
    initialData: initial?.me,
  });
  const { data: pages } = useQuery({
    queryKey: ["pages"],
    queryFn: getJson<SidebarData["pages"]>("/api/pages", []),
    initialData: initial?.pages,
  });
  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: getJson<SidebarData["chats"]>("/api/chats", []),
    initialData: initial?.chats,
  });
  const slug = me?.slug ?? SYSTEM_SLUG;

  return (
    <aside
      className={`${mobile ? "flex w-full border-0" : "hidden w-64 border-r md:flex"} h-full shrink-0 flex-col gap-2 bg-sidebar p-2 text-sidebar-foreground`}
    >
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
          <NavSection
            label="Pages"
            empty="No pages yet. Create one to get started."
            icon={FileText}
            items={pages?.map((page) => ({
              key: page.id,
              href: `/u/${slug}/p/${page.seedId ?? page.id}`,
              title: page.title,
            }))}
          />
          <NavSection
            label="Chats"
            empty="No chats yet. Start one to ask about your data."
            icon={MessageSquare}
            items={chats?.map((chat) => ({ key: chat.id, href: `/u/${slug}/c/${chat.id}`, title: chat.title }))}
            className="mt-3"
          />
        </div>
      </ScrollArea>
    </aside>
  );
}

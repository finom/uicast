import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type LinkGridProps = {
  title: string;
  icon: LucideIcon;
  items: { key: string | number; href: string; title: string; owner?: string }[];
  empty?: string;
};

// A titled grid of links to pages or chats; `owner` adds the owner's @slug.
export function LinkGrid({ title, icon: Icon, items, empty }: LinkGridProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {items.length === 0 && empty && <p className="text-sm text-muted-foreground">{empty}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.title}</span>
            {item.owner && <span className="ml-auto shrink-0 text-xs text-muted-foreground">@{item.owner}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

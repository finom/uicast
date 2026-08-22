import type { ComponentEntry } from "@uicast/core";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { componentEntries, pages } from "@/db/schema";
import { PageView } from "./page-view";

// Entries change after every generation run — never serve a static snapshot.
export const dynamic = "force-dynamic";

export default async function GeneratedPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [page] = Number.isNaN(id) ? [] : await db.select().from(pages).where(eq(pages.id, id));
  if (!page) notFound();

  const rows = await db
    .select({ data: componentEntries.data })
    .from(componentEntries)
    .where(eq(componentEntries.pageId, page.id))
    .orderBy(asc(componentEntries.id));

  return (
    <PageView
      page={{ id: page.id, title: page.title, prompt: page.prompt }}
      initialEntries={rows.map((row) => row.data as ComponentEntry)}
    />
  );
}

import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { componentEntries, pages, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { PageView } from "@/components/page-view";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: PageProps<"/u/[slug]/p/[id]">) {
  const { slug, id } = await params;
  // A seeded page is addressed by its seed id, any other by its row id.
  const [row] = await db
    .select({ page: pages })
    .from(pages)
    .innerJoin(users, eq(pages.userId, users.id))
    .where(and(/^\d+$/.test(id) ? eq(pages.id, Number(id)) : eq(pages.seedId, id), eq(users.slug, slug)));
  if (!row) notFound();
  const me = await getSessionUser();

  const rows = await db
    .select({ data: componentEntries.data })
    .from(componentEntries)
    .where(eq(componentEntries.pageId, row.page.id))
    .orderBy(asc(componentEntries.id));

  return (
    <PageView
      page={{
        id: row.page.id,
        title: row.page.title,
        prompt: row.page.prompt,
        inputTokens: row.page.inputTokens,
        outputTokens: row.page.outputTokens,
        costUsd: row.page.costUsd,
        model: row.page.model,
      }}
      initialEntries={rows.map((r) => r.data)}
      ownerSlug={slug}
      readonly={me?.id !== row.page.userId}
    />
  );
}

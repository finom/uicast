import type { ComponentEntry } from "@uicast/core";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { componentEntries, pages, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { GENERATION_MODEL } from "@/lib/openrouter";
import { PageView } from "../../../../pages/[id]/page-view";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: rawId } = await params;
  const id = Number(rawId);
  const [row] = Number.isNaN(id)
    ? []
    : await db
        .select({ page: pages })
        .from(pages)
        .innerJoin(users, eq(pages.userId, users.id))
        .where(and(eq(pages.id, id), eq(users.slug, slug)));
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
      }}
      initialEntries={rows.map((r) => r.data as ComponentEntry)}
      ownerSlug={slug}
      readonly={me?.id !== row.page.userId}
      model={GENERATION_MODEL}
    />
  );
}

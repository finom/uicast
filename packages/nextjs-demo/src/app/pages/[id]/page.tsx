import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { pages, users } from "@/db/schema";

export const dynamic = "force-dynamic";

// Legacy path — the canonical URL carries the owner: /u/<slug>/p/<id>.
export default async function LegacyPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [row] = Number.isNaN(id)
    ? []
    : await db
        .select({ slug: users.slug })
        .from(pages)
        .innerJoin(users, eq(pages.userId, users.id))
        .where(eq(pages.id, id));
  if (!row) notFound();
  redirect(`/u/${row.slug}/p/${id}`);
}

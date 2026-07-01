import { eq } from "drizzle-orm";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";

export default async function PageView({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [page] = Number.isNaN(id) ? [] : await db.select().from(pages).where(eq(pages.id, id));
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{page.title}</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        This page has no generated content yet.
      </p>
    </div>
  );
}

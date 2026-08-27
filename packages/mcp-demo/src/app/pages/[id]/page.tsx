import { notFound } from "next/navigation";
import { read } from "@/store";
import { PageView } from "./page-view";

// Entries change after every generation run — never serve a static snapshot.
export const dynamic = "force-dynamic";

export default async function GeneratedPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const page = Number.isNaN(id) ? undefined : read().pages.find((row) => row.id === id);
  if (!page) notFound();

  const entries = read()
    .entries.filter((entry) => entry.pageId === page.id)
    .sort((a, b) => a.id - b.id)
    .map((entry) => entry.data);

  return (
    <PageView
      page={{ id: page.id, title: page.title, prompt: page.prompt }}
      initialEntries={entries}
    />
  );
}

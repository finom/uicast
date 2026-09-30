import { docsPages } from "@/lib/docs-pages";
import { SITE, sectionOf } from "@/lib/site";

// The llms.txt index (llmstxt.org): the sidebar's pages with their descriptions. The static export writes it to a file.
export const dynamic = "force-static";

export async function GET() {
  const [index, ...pages] = (await docsPages()).filter(({ hidden }) => !hidden);
  const sections = new Map<string, string[]>();
  for (const { route, title, description } of pages) {
    const section = sectionOf(route) ?? "Docs";
    sections.set(section, [...(sections.get(section) ?? []), `- [${title}](${SITE + route}): ${description}`]);
  }
  const body = [
    "# uicast",
    `> ${index.description}`,
    `All these pages in one Markdown file: ${SITE}/context/docs.md`,
    ...Array.from(sections, ([section, links]) => `## ${section}\n\n${links.join("\n")}`),
  ].join("\n\n");
  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

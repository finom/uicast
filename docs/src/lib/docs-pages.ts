import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MdxFile, PageMapItem } from "nextra";
import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";

const DOCS = path.join(process.cwd(), "src/app/(docs)");

const files = (items: PageMapItem[]): MdxFile[] =>
  items.flatMap((item) => ("children" in item ? files(item.children) : "frontMatter" in item ? [item] : []));

// Every docs page: the sidebar's in sidebar order, then the hidden ones. Nextra's page map carries each page's front
// matter, with the title taken from the first heading when the front matter has none, and the time of its last commit.
export async function docsPages() {
  const pageMap = await getPageMap();
  const sidebar = normalizePages({ list: pageMap, route: "/" }).flatDocsDirectories.map(({ route }) => route);
  const rank = (route: string) => (sidebar.includes(route) ? sidebar.indexOf(route) : sidebar.length);
  return Promise.all(
    files(pageMap)
      .sort((a, b) => rank(a.route) - rank(b.route))
      .map(async ({ route, frontMatter }) => ({
        route,
        hidden: !sidebar.includes(route),
        mdx: await readFile(path.join(DOCS, route, "page.mdx"), "utf8"),
        title: String(frontMatter?.title ?? route),
        description: String(frontMatter?.description ?? ""),
        lastModified: frontMatter?.timestamp ? new Date(frontMatter.timestamp) : undefined,
      })),
  );
}

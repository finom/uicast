import { readFile } from "node:fs/promises";
import path from "node:path";
import { normalizePages } from "nextra/normalize-pages";
import { getPageMap } from "nextra/page-map";

const DOCS = path.join(process.cwd(), "src/app/(docs)");

// The docs pages in sidebar order, hidden ones left out. The title follows Nextra: front matter first, then the heading.
export async function docsPages() {
  const { flatDocsDirectories } = normalizePages({ list: await getPageMap(), route: "/" });
  return Promise.all(
    flatDocsDirectories.map(async ({ route }) => {
      const mdx = await readFile(path.join(DOCS, route, "page.mdx"), "utf8");
      const frontMatter = mdx.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
      const title = frontMatter.match(/^title:\s*(.+)$/m)?.[1] ?? mdx.match(/^# (.+)$/m)?.[1] ?? route;
      return { route, mdx, title };
    }),
  );
}

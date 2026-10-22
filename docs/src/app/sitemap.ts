import type { MetadataRoute } from "next";
import { docsPages } from "@/lib/docs-pages";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = (await docsPages()).map(({ route, lastModified }) => ({ url: SITE + route, lastModified }));
  return [{ url: `${SITE}/` }, ...pages];
}

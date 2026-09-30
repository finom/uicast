import { SITE, sectionOf } from "@/lib/site";

// Schema.org data for search engines, as the text of a JSON-LD script: the project on the index, a breadcrumb trail on
// every other page. "<" is escaped so the text cannot close the script tag.
export function jsonLd(route: string, title: string, description: string) {
  const folder = `/${route.split("/")[1]}`;
  const section = route === folder ? undefined : sectionOf(route);
  const trail = [["uicast", `${SITE}/`], ...(section ? [[section, SITE + folder]] : []), [title, SITE + route]];
  const data =
    route === "/"
      ? {
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: "uicast", url: `${SITE}/` },
            {
              "@type": "SoftwareSourceCode",
              name: "uicast",
              description,
              url: `${SITE}/`,
              codeRepository: "https://github.com/finom/uicast",
              programmingLanguage: "TypeScript",
              license: "https://github.com/finom/uicast/blob/main/LICENSE",
              author: { "@type": "Person", name: "Andrey Gubanov", url: "https://github.com/finom" },
            },
          ],
        }
      : {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
        };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

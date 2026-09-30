import type { MDXComponents } from "mdx/types";
import type { MDXWrapper } from "nextra";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { ogImage, SITE } from "@/lib/site";
import { jsonLd } from "@/lib/structured-data";

// Each page's address, social card and structured data. React moves the link and meta tags into <head>; the root layout
// sets the rest of Open Graph.
const Wrapper: MDXWrapper = (props) => {
  const { wrapper: ThemeWrapper = ({ children }) => children } = getThemeComponents();
  const { filePath, title, description } = props.metadata;
  const route = `/${filePath.replace(/^src\/app\/|\([^)]*\)\/|\/?page\.mdx$/g, "")}`;
  const image = SITE + ogImage(route);
  return (
    <>
      <link rel="canonical" href={SITE + route} />
      <meta property="og:url" content={SITE + route} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1280" />
      <meta property="og:image:height" content="640" />
      <meta name="twitter:image" content={image} />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: our own JSON, escaped by `jsonLd`
        dangerouslySetInnerHTML={{ __html: jsonLd(route, title, description ?? "") }}
      />
      <ThemeWrapper {...props} />
    </>
  );
};

// Read per call, not copied at module scope, for the same reason as the docs layout's navbar.
export function useMDXComponents(components?: MDXComponents) {
  return { ...getThemeComponents(), wrapper: Wrapper, ...components };
}

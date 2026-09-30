import type { MDXComponents } from "mdx/types";
import type { MDXWrapper } from "nextra";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { ogImage, SITE } from "@/lib/site";

// Each page's social card; React moves these tags into <head>. The root layout sets the rest of Open Graph.
const Wrapper: MDXWrapper = (props) => {
  const { wrapper: ThemeWrapper = ({ children }) => children } = getThemeComponents();
  const route = `/${props.metadata.filePath.replace(/^src\/app\/|\([^)]*\)\/|\/?page\.mdx$/g, "")}`;
  const image = SITE + ogImage(route);
  return (
    <>
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1280" />
      <meta property="og:image:height" content="640" />
      <meta name="twitter:image" content={image} />
      <ThemeWrapper {...props} />
    </>
  );
};

// Read per call, not copied at module scope, for the same reason as the docs layout's navbar.
export function useMDXComponents(components?: MDXComponents) {
  return { ...getThemeComponents(), wrapper: Wrapper, ...components };
}

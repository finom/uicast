import type { MDXComponents } from "mdx/types";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";

// Read per call, not copied at module scope, for the same reason as the docs layout's navbar.
export function useMDXComponents(components?: MDXComponents) {
  return { ...getThemeComponents(), ...components };
}

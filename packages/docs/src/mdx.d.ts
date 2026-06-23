declare module "*.mdx" {
  import type { FC } from "react";
  import type { MDXComponents } from "mdx/types";
  const MDXComponent: FC<{ components?: MDXComponents }>;
  export default MDXComponent;
}

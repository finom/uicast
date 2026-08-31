import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { BetaBadge } from "../../components/beta-badge";
import "nextra-theme-docs/style.css";
// Tailwind + the catalog's design tokens, so mini-examples can render real
// catalog components (Card, …) on docs pages. Preflight lives in @layer base,
// which Nextra's unlayered stylesheet outranks, so the docs chrome keeps its
// look.
import "../globals.css";

// Nextra docs chrome — navbar, a sidebar built from the App Router `page.mdx`
// files (ordered by src/app/_meta.global.tsx), and a footer — wrapped around every docs
// route. /demo sits outside this route group, so it keeps its own full-bleed
// providers instead of this Layout.
const navbar = (
  <Navbar
    logo={
      <b className="flex items-center gap-2 text-lg">
        uicast
        <BetaBadge />
      </b>
    }
  />
);
const footer = <Footer>MIT — the open JSONLines UI engine.</Footer>;

export default async function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Layout
      navbar={navbar}
      footer={footer}
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/finom/uicast/tree/main/packages/docs"
    >
      {children}
    </Layout>
  );
}

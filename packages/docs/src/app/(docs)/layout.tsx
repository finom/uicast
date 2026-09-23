import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { BetaBadge } from "../../components/beta-badge";
import "nextra-theme-docs/style.css";
// Preflight lives in @layer base, which Nextra's unlayered stylesheet outranks, so the docs chrome keeps its look.
import "../globals.css";

// The navbar and footer are built in render. Built at module scope, they kept an import that a hot reload had left
// undefined, and every refresh failed with "Element type is invalid".
export default async function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Layout
      navbar={
        <Navbar
          logo={
            <b className="flex items-center gap-2 text-lg">
              uicast
              <BetaBadge />
            </b>
          }
        />
      }
      footer={
        <Footer>
          <span>
            MIT © {new Date().getFullYear()}{" "}
            <a href="https://github.com/finom" target="_blank" rel="noreferrer">
              Andrey Gubanov
            </a>
          </span>
        </Footer>
      }
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/finom/uicast/tree/main/packages/docs"
    >
      {children}
    </Layout>
  );
}

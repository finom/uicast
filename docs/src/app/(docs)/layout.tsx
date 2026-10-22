import Image from "next/image";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import type { ReactNode } from "react";
import { BetaBadge } from "../../components/beta-badge";
import { SiteFooter } from "../../components/site-footer";
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
            <span className="flex items-center gap-2.5 text-lg">
              <Image src="/logo-text.svg" alt="uicast" width={110} height={26} className="dark:hidden" />
              <Image src="/logo-text-dark.svg" alt="uicast" width={110} height={26} className="hidden dark:block" />
              <BetaBadge />
            </span>
          }
          projectLink="https://github.com/finom/uicast"
        >
          <a
            href="https://warehouse.uicast.dev"
            className="shrink-0 rounded-full bg-(--uc-ink) px-[18px] py-[10px] text-[15px] font-semibold leading-tight text-(--uc-bg)"
          >
            Live demo
          </a>
        </Navbar>
      }
      footer={
        <Footer>
          <SiteFooter />
        </Footer>
      }
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/finom/uicast/tree/main/docs"
    >
      {children}
    </Layout>
  );
}

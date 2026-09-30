import Image from "next/image";
import { getPageMap } from "nextra/page-map";
import { DiscordIcon } from "nextra/icons";
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
              <Image src="/uicast-logo.svg" alt="" width={24} height={24} className="dark:hidden" />
              <Image src="/uicast-logo-dark.svg" alt="" width={24} height={24} className="hidden dark:block" />
              uicast
              <BetaBadge />
            </b>
          }
          projectLink="https://github.com/finom/uicast"
          chatLink="https://discord.com/invite/qdT8WEHUuP"
          chatIcon={<DiscordIcon width="24" aria-label="Discord server" />}
        >
          <a href="https://x.com/andrey_gubanov1" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
              <title>Andrey Gubanov on X</title>
              <path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z" />
            </svg>
          </a>
        </Navbar>
      }
      footer={
        <Footer>
          <span>
            <a href="https://github.com/finom/uicast/blob/main/LICENSE" target="_blank" rel="noreferrer">
              MIT
            </a>{" "}
            © {new Date().getFullYear()}{" "}
            <a href="https://github.com/finom" target="_blank" rel="noreferrer">
              Andrey Gubanov
            </a>
          </span>
        </Footer>
      }
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/finom/uicast/tree/main/docs"
    >
      {children}
    </Layout>
  );
}

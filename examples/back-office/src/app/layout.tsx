import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/toaster";
import { loadSidebar } from "@/lib/sidebar";
import { Providers } from "./providers";
// Formulas in chat replies, drawn by Streamdown's math plugin.
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata = { title: "Warehouse — uicast demo" };

// Runs before paint and keeps listening, so an OS-level switch rethemes the app live.
const themeScript = `(() => {
  const m = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => document.documentElement.classList.toggle("dark", m.matches);
  apply();
  m.addEventListener("change", apply);
})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const sidebar = await loadSidebar();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static inline theme bootstrap */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <Providers>
          <div className="flex h-svh flex-col">
            <AppHeader />
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar initial={sidebar} />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

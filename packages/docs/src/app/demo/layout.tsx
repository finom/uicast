import type { ReactNode } from "react";
import { Providers } from "./providers";
import "../globals.css";

// Standalone chrome for the interactive demo — its own theme provider and a
// full-bleed surface, separate from the MDX docs pages.
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </div>
    </Providers>
  );
}

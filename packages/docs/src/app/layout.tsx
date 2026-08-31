import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Head } from "nextra/components";

export const metadata: Metadata = {
  title: {
    default: "uicast",
    template: "%s — uicast",
  },
  description:
    "The open engine that renders streamed JSONLines into a live UI, plus its shadcn component catalog.",
};

// Bare root shell. The (docs) route group adds the Nextra theme chrome; the
// /demo subtree wraps itself in its own theme provider. suppressHydrationWarning
// lets next-themes set the `class` on <html> without a mismatch warning.
// Nextra's <Head> injects the --nextra-bg / primary-hue CSS vars its chrome
// paints with — without it the mobile nav has no background. Colors match the
// shadcn tokens in globals.css.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head backgroundColor={{ light: "#ffffff", dark: "#0a0a0a" }} />
      <body>{children}</body>
    </html>
  );
}

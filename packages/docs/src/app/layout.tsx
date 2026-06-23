import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "ui-fired",
    template: "%s — ui-fired",
  },
  description:
    "The open engine that renders streamed JSONLines into a live UI, plus its shadcn component catalog.",
};

// Bare root shell. The (docs) route group adds the Nextra theme chrome; the
// /demo subtree wraps itself in its own theme provider. suppressHydrationWarning
// lets next-themes set the `class` on <html> without a mismatch warning.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Head } from "nextra/components";

export const metadata: Metadata = {
  title: { default: "uicast", template: "%s — uicast" },
  description: "The expression-driven generative UI framework.",
};

// suppressHydrationWarning lets next-themes set the `class` on <html>. Nextra's <Head> injects the CSS vars its chrome
// paints with; without it the mobile nav has no background.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head backgroundColor={{ light: "#ffffff", dark: "#0a0a0a" }} />
      <body>{children}</body>
    </html>
  );
}

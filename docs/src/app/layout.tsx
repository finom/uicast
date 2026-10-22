import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import { Head } from "nextra/components";

const display = Unbounded({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://uicast.dev"),
  title: { default: "uicast", template: "%s — uicast" },
  description: "The expression-driven generative UI framework.",
  // The image is each page's own, from the MDX wrapper.
  openGraph: { siteName: "uicast", type: "website" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

// suppressHydrationWarning lets next-themes set the `class` on <html>. Nextra's <Head> injects the CSS vars its chrome
// paints with; without it the mobile nav has no background.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <Head
        // Links in the landing's violet: #5a43b8 on cream, #a795ff on ink.
        color={{
          hue: { light: 252, dark: 250 },
          saturation: { light: 46.6, dark: 100 },
          lightness: { light: 49.2, dark: 79.2 },
        }}
        backgroundColor={{ light: "#fff8f1", dark: "#15121f" }}
      />
      <body>{children}</body>
    </html>
  );
}

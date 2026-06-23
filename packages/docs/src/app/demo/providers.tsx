"use client";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * App-wide providers. `next-themes` toggles the `dark` class on <html>, which
 * activates the `.dark` token block in globals.css (and the `dark` Tailwind
 * variant). Defaults to the OS preference.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

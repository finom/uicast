"use client";
import type { ComponentEntry } from "@uicast/core";
import { useEffect, useState } from "react";
import { Orders } from "./renderer";

/**
 * Docs-only. The example's entries are served as a static asset and loaded
 * client-side, because the document's async `seed` cannot resolve during the
 * site's static export. Kept out of `renderer.tsx` so the snippet the page
 * shows is the mount and nothing else.
 */
export function OrdersLoader() {
  const [entries, setEntries] = useState<ComponentEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/mini-examples/orders")
      .then((res) => res.json())
      .then(setEntries);
  }, []);

  return entries ? <Orders entries={entries} /> : null;
}

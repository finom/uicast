"use client";
import type { ComponentEntry } from "@uicast/core";
import { useEffect, useState } from "react";
import { Products } from "./renderer";

// Fetched client-side: the async `seed` cannot resolve during the static export. Not in `renderer.tsx`, so the page snippet is the mount only.
export function OrdersLoader() {
  const [entries, setEntries] = useState<ComponentEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/mini-examples/orders").then((res) => res.json()).then(setEntries);
  }, []);

  return entries ? <Products entries={entries} /> : null;
}

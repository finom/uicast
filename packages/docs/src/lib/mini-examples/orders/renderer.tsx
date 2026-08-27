"use client";
import { useEffect, useState } from "react";
import { EntriesRenderer, RendererProvider } from "@uicast/react";
import { ButtonImpl, CardImpl, HeadingImpl, OrderRowImpl } from "./impl";
import { listOrders } from "./functions";
import orderEntries from "./entries.json";

const implementations = [CardImpl, HeadingImpl, ButtonImpl, OrderRowImpl];
const functions = [listOrders];

export function Orders() {
  // The async seed can't resolve during SSR — mount client-side only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <RendererProvider implementations={implementations} functions={functions}>
      <EntriesRenderer entries={orderEntries} />
    </RendererProvider>
  );
}

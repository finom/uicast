import type { ComponentEntry } from "@uicast/core";
import delivery from "./delivery.json";
import kanban from "./kanban.json";
import loan from "./loan.json";
import orders from "./orders.json";
import shop from "./shop.json";
import warehouses from "./warehouses.json";
import wifi from "./wifi.json";

// Not in `replay.tsx`, which is `"use client"`: the docs context reads these on the server.
export const EXAMPLES = [
  { label: "Orders", prompt: "Show this week's orders, with refund buttons.", entries: orders },
  { label: "Kanban", prompt: "Orders to ship, as a kanban I can drag.", entries: kanban },
  { label: "Map", prompt: "Map our warehouses. Click one to see its stock.", entries: warehouses },
  { label: "Delivery", prompt: "Let customers book a delivery slot.", entries: delivery },
  { label: "Shop", prompt: "A shop page for our coffee, with a cart.", entries: shop },
  { label: "Loan", prompt: "Loan calculator with a payoff chart.", entries: loan },
  { label: "Wi-Fi QR", prompt: "A QR code our guests scan to join the Wi-Fi.", entries: wifi },
].map(({ entries, ...example }) => ({ ...example, lines: entries as ComponentEntry[] }));

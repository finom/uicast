// biome-ignore-all format: one entry per line, as in a document
import type { Example } from ".";

export const layout: Record<string, Example> = {
  Accordion: [
    { key: "accordion", component: "Accordion", props: { literal: { type: "single", collapsible: true } }, children: ["shipping", "returns", "payment"] },
    { key: "shipping", component: "AccordionItem", props: { literal: { title: "Shipping", open: true } }, children: ["shipping-text"] },
    { key: "shipping-text", component: "Typography", props: { literal: { text: "Orders ship within 2 business days via standard courier." } } },
    { key: "returns", component: "AccordionItem", props: { literal: { title: "Returns" } }, children: ["returns-text"] },
    { key: "returns-text", component: "Typography", props: { literal: { text: "Unopened items can be returned within 30 days." } } },
    { key: "payment", component: "AccordionItem", props: { literal: { title: "Payment terms" } }, children: ["payment-text"] },
    { key: "payment-text", component: "Typography", props: { literal: { text: "Net 30 for approved wholesale accounts." } } },
  ],
  AccordionItem: "Accordion", // a part: shown in the Accordion example

  AspectRatio: [
    { key: "ratio", component: "AspectRatio", props: { literal: { ratio: 1.5 } }, children: ["photo"] },
    { key: "photo", component: "Picture", props: { literal: { src: "/uicast-hero-light.svg", alt: "Warehouse shelving", objectFit: "cover" } } },
  ],

  Card: [
    { key: "card", component: "Card", props: { literal: { title: "Revenue", description: "Last 30 days" } }, children: ["total"] },
    { key: "total", component: "Typography", props: { literal: { text: "$48,200 from 312 orders." } } },
  ],

  Container: [
    { key: "container", component: "Container", props: { literal: { maxWidth: "sm", padding: "default", gap: "2" } }, children: ["heading", "body"] },
    { key: "heading", component: "Heading", props: { literal: { level: "3", text: "Supplier onboarding" } } },
    { key: "body", component: "Typography", props: { literal: { text: "New suppliers need a signed W-9 and a certificate of insurance before their first purchase order." } } },
  ],

  Divider: [
    { key: "receipt", component: "FlexCol", props: { literal: { gap: "2" } }, children: ["subtotal", "rule", "total"] },
    { key: "subtotal", component: "Typography", props: { literal: { text: "Subtotal: $128.00" } } },
    { key: "rule", component: "Divider", props: { literal: { orientation: "horizontal" } } },
    { key: "total", component: "Typography", props: { literal: { text: "Total: $138.00" } } },
  ],

  FlexCol: [
    { key: "col", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["name", "email", "phone"] },
    { key: "name", component: "Typography", props: { literal: { text: "Priya Shah", variant: "large" } } },
    { key: "email", component: "Typography", props: { literal: { text: "priya@bloomcafe.com", variant: "muted" } } },
    { key: "phone", component: "Typography", props: { literal: { text: "+1 415 555 0148", variant: "muted" } } },
  ],

  FlexRow: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "2" } }, children: ["paid", "pending", "cancelled"] },
    { key: "paid", component: "Badge", props: { literal: { text: "Paid", variant: "default" } } },
    { key: "pending", component: "Badge", props: { literal: { text: "Pending", variant: "secondary" } } },
    { key: "cancelled", component: "Badge", props: { literal: { text: "Cancelled", variant: "destructive" } } },
  ],

  Grid: [
    { key: "grid", component: "Grid", props: { literal: { columns: "3", gap: "4" } }, children: ["revenue", "orders", "returns"] },
    { key: "revenue", component: "Stat", props: { literal: { label: "Revenue", value: "$48,200", trend: "up", trendValue: "+12%" } } },
    { key: "orders", component: "Stat", props: { literal: { label: "Orders", value: "312", trend: "up", trendValue: "+4%" } } },
    { key: "returns", component: "Stat", props: { literal: { label: "Returns", value: "9", trend: "down", trendValue: "-2%" } } },
  ],

  ResizablePanel: [
    { key: "panels", component: "ResizablePanel", props: { literal: { direction: "horizontal", defaultSize: 50, minSize: 20 } }, children: ["list", "detail"] },
    { key: "list", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["o1", "o2", "o3"] },
    { key: "o1", component: "Typography", props: { literal: { text: "#1042 — Café Bloom" } } },
    { key: "o2", component: "Typography", props: { literal: { text: "#1043 — Nordic Roasters" } } },
    { key: "o3", component: "Typography", props: { literal: { text: "#1044 — Acme Foods" } } },
    { key: "detail", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["detail-title", "detail-body"] },
    { key: "detail-title", component: "Heading", props: { literal: { level: "4", text: "Order #1042" } } },
    { key: "detail-body", component: "Typography", props: { literal: { text: "3 items, $128.00, shipped Sept 25." } } },
  ],

  ScrollArea: [
    { key: "scroll", component: "ScrollArea", props: { literal: { height: 160 } }, seed: [{ set: "scopes.root.events", expr: "Array.from({ length: 30 }, (_, i) => ({ id: i, text: 'Order #' + (1042 + i) + ' ' + ['packed', 'shipped', 'delivered', 'returned'][i % 4] + '.' }))" }], children: ["feed"] },
    { key: "feed", component: "FlexCol", props: { literal: { gap: "2" } }, children: ["event"] },
    { key: "event", component: "Typography", each: "scopes.root.events", as: "event", keyBy: "id", props: { expr: "({ text: scopes.event.text })" } },
  ],

  StickyHeader: [
    { key: "scroll", component: "ScrollArea", props: { literal: { height: 200 } }, seed: [{ set: "scopes.root.orders", expr: "Array.from({ length: 30 }, (_, i) => ({ id: 1042 + i, customer: ['Café Bloom', 'Nordic Roasters', 'Acme Foods', 'Harbor Market', 'Linden Deli'][i % 5], total: 40 + (i * 37) % 260 }))" }], children: ["sticky", "body"] },
    { key: "sticky", component: "StickyHeader", props: { literal: { bordered: true } }, children: ["sticky-title"] },
    { key: "sticky-title", component: "Typography", props: { literal: { text: "Orders — Sept 27", variant: "large" } } },
    { key: "body", component: "Container", props: { literal: { maxWidth: "full", gap: "2" } }, children: ["row"] },
    { key: "row", component: "Typography", each: "scopes.root.orders", as: "order", keyBy: "id", props: { expr: "({ text: '#' + scopes.order.id + ' — ' + scopes.order.customer + ' — $' + scopes.order.total })" } },
  ],

  Tabs: [
    { key: "tabs", component: "Tabs", props: { expr: "({ value: scopes.root.tab })" }, seed: [{ set: "scopes.root.tab", literal: "orders" }], callbacks: { onChange: [{ set: "scopes.root.tab", expr: "evt.value" }] }, children: ["tab-list", "orders-panel", "suppliers-panel"] },
    { key: "tab-list", component: "TabList", props: { literal: {} }, children: ["orders-tab", "suppliers-tab"] },
    { key: "orders-tab", component: "TabTrigger", props: { literal: { value: "orders", text: "Orders" } } },
    { key: "suppliers-tab", component: "TabTrigger", props: { literal: { value: "suppliers", text: "Suppliers" } } },
    { key: "orders-panel", component: "TabContent", props: { literal: { value: "orders" } }, children: ["orders-text"] },
    { key: "orders-text", component: "Typography", props: { literal: { text: "14 open orders, 3 awaiting payment." } } },
    { key: "suppliers-panel", component: "TabContent", props: { literal: { value: "suppliers" } }, children: ["suppliers-text"] },
    { key: "suppliers-text", component: "Typography", props: { literal: { text: "Acme Foods and Nordic Roasters are due for restock." } } },
  ],
  TabList: "Tabs", // a part: shown in the Tabs example
  TabTrigger: "Tabs", // a part: shown in the Tabs example
  TabContent: "Tabs", // a part: shown in the Tabs example
};

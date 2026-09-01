import type { ComponentEntry } from "@uicast/core";
import { db } from "./index";
import { chatMessages, chats, componentEntries, pages } from "./schema";

// The default content every account starts from: the demo user's pages and
// chats, copied verbatim into each new user's workspace at signup so they can
// continue from a working example instead of a blank page.

export type SeedUsage = { inputTokens: number; outputTokens: number; costUsd: number };
export const SEED_MODEL = "anthropic/claude-opus-5";

// ---------------------------------------------------------------------------
// Page 1 — Inventory & restock
// ---------------------------------------------------------------------------
const inventoryEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.q", literal: "" },
      { set: "scopes.root.cat", literal: "all" },
      { set: "scopes.root.rcvOpen", literal: false },
      { set: "scopes.root.rcvProductId", literal: "" },
      { set: "scopes.root.rcvQty", literal: 10 },
      { set: "scopes.root.rcvNote", literal: "" },
      { set: "scopes.root.products", expr: "listProducts()" },
      { set: "scopes.root.suppliers", expr: "listSuppliers()" },
    ],
    children: ["header", "stats", "charts", "toolbar", "table-card", "rcv-drawer"],
  },
  {
    key: "header",
    component: "FlexRow",
    props: { literal: { justify: "between", align: "center" } },
    children: ["header-text", "rcv-btn"],
  },
  { key: "header-text", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["title", "subtitle"] },
  { key: "title", component: "Heading", props: { literal: { level: "1", text: "Inventory & restock" } } },
  {
    key: "subtitle",
    component: "Text",
    props: { literal: { text: "Live stock levels, supplier lead times, and receiving.", variant: "muted" } },
  },
  {
    key: "rcv-btn",
    component: "Button",
    props: { literal: { text: "Receive stock" } },
    callbacks: { onClick: [{ set: "scopes.root.rcvOpen", literal: true }] },
  },
  { key: "stats", component: "Grid", props: { literal: { columns: "4", gap: "4" } }, children: ["s-count", "s-low", "s-value", "s-restock"] },
  {
    key: "s-count",
    component: "Stat",
    props: { expr: "({ label: 'Products', value: scopes.root.products.length, helpText: 'in catalog' })" },
  },
  {
    key: "s-low",
    component: "Stat",
    props: {
      expr: "({ label: 'Low stock', value: scopes.root.products.filter(p => p.stock <= 20).length, trend: scopes.root.products.filter(p => p.stock <= 20).length > 0 ? 'down' : 'neutral', helpText: '20 units or fewer' })",
    },
  },
  {
    key: "s-value",
    component: "Stat",
    props: {
      expr: "({ label: 'Stock value', value: '$' + Math.round(scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0)).toLocaleString(), helpText: 'at list price' })",
    },
  },
  {
    key: "s-restock",
    component: "Stat",
    props: {
      expr: "({ label: 'Restock to 50', value: '$' + Math.round(scopes.root.products.filter(p => p.stock < 50).reduce((s, p) => s + (50 - p.stock) * p.price, 0)).toLocaleString(), helpText: 'to bring every item to 50 units' })",
    },
  },
  { key: "charts", component: "Grid", props: { literal: { columns: "2", gap: "4" } }, children: ["chart-stock", "chart-share"] },
  { key: "chart-stock", component: "Card", props: { literal: { title: "Units by category" } }, children: ["bar"] },
  {
    key: "bar",
    component: "BarChart",
    props: {
      expr: "({ data: Object.entries(scopes.root.products.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + p.stock }), {})).map(([name, value]) => ({ name, value })), xKey: 'name', yKeys: ['value'], height: 240 })",
    },
  },
  { key: "chart-share", component: "Card", props: { literal: { title: "Value share by category" } }, children: ["donut"] },
  {
    key: "donut",
    component: "DonutChart",
    props: {
      expr: "({ data: Object.entries(scopes.root.products.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + p.price * p.stock }), {})).map(([name, value]) => ({ name, value: Math.round(value) })), height: 240, centerLabel: '$' + Math.round(scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0) / 1000) + 'k' })",
    },
  },
  { key: "toolbar", component: "FlexRow", props: { literal: { gap: "2" } }, children: ["search", "cat-filter"] },
  {
    key: "search",
    component: "SearchInput",
    props: { expr: "({ value: scopes.root.q, placeholder: 'Search products or SKU…' })" },
    callbacks: { onChange: [{ set: "scopes.root.q", expr: "evt.value" }] },
  },
  {
    key: "cat-filter",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.cat, options: [{ label: 'All categories', value: 'all' }, { label: 'Lighting', value: 'Lighting' }, { label: 'Furniture', value: 'Furniture' }, { label: 'Electronics', value: 'Electronics' }, { label: 'Accessories', value: 'Accessories' }] })",
    },
    callbacks: { onChange: [{ set: "scopes.root.cat", expr: "evt.value" }] },
  },
  { key: "table-card", component: "Card", props: { literal: { title: "Products" } }, children: ["table"] },
  { key: "table", component: "Table", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["hrow"] },
  { key: "hrow", component: "TableRow", children: ["h-name", "h-sku", "h-sup", "h-stock", "h-price"] },
  { key: "h-name", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "h-sku", component: "TableHead", props: { literal: { text: "SKU" } } },
  { key: "h-sup", component: "TableHead", props: { literal: { text: "Supplier (lead time)" } } },
  { key: "h-stock", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "h-price", component: "TableHead", props: { literal: { text: "Price" } } },
  { key: "tbody", component: "TableBody", children: ["row"] },
  {
    key: "row",
    component: "TableRow",
    each: "scopes.root.products.filter(p => (scopes.root.cat === 'all' || p.category === scopes.root.cat) && (p.name.toLowerCase().includes(scopes.root.q.toLowerCase()) || p.sku.toLowerCase().includes(scopes.root.q.toLowerCase()))).slice(0, 100)",
    as: "prod",
    keyBy: "id",
    children: ["c-name", "c-sku", "c-sup", "c-stock", "c-price"],
  },
  { key: "c-name", component: "TableCell", props: { expr: "({ text: scopes.prod.item.name })" } },
  { key: "c-sku", component: "TableCell", props: { expr: "({ text: scopes.prod.item.sku })" } },
  {
    key: "c-sup",
    component: "TableCell",
    props: {
      expr: "({ text: (scopes.root.suppliers.find(s => s.id === scopes.prod.item.supplierId)?.name ?? '—') + ' (' + (scopes.root.suppliers.find(s => s.id === scopes.prod.item.supplierId)?.leadTimeDays ?? '?') + 'd)' })",
    },
  },
  { key: "c-stock", component: "TableCell", children: ["stock-badge"] },
  {
    key: "stock-badge",
    component: "Badge",
    props: {
      expr: "({ text: scopes.prod.item.stock, variant: scopes.prod.item.stock <= 10 ? 'destructive' : scopes.prod.item.stock <= 20 ? 'outline' : 'secondary' })",
    },
  },
  { key: "c-price", component: "TableCell", props: { expr: "({ text: '$' + scopes.prod.item.price.toFixed(2) })" } },
  // Receiving drawer: records a stock movement, which adjusts stock atomically.
  {
    key: "rcv-drawer",
    component: "Drawer",
    props: { expr: "({ open: scopes.root.rcvOpen, title: 'Receive stock', description: 'Records a movement in the ledger and adjusts the count.', side: 'right' })" },
    callbacks: { onOpenChange: [{ set: "scopes.root.rcvOpen", expr: "evt.open" }] },
    children: ["rcv-form"],
  },
  { key: "rcv-form", component: "FlexCol", props: { literal: { gap: "4" } }, children: ["f-prod", "f-qty", "f-note", "rcv-actions"] },
  { key: "f-prod", component: "Field", children: ["l-prod", "i-prod"] },
  { key: "l-prod", component: "FieldLabel", props: { literal: { text: "Product" } } },
  {
    key: "i-prod",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.rcvProductId, placeholder: 'Pick a product', options: scopes.root.products.map(p => ({ label: p.name + ' (' + p.stock + ' in stock)', value: String(p.id) })) })",
    },
    callbacks: { onChange: [{ set: "scopes.root.rcvProductId", expr: "evt.value" }] },
  },
  { key: "f-qty", component: "Field", children: ["l-qty", "i-qty"] },
  { key: "l-qty", component: "FieldLabel", props: { literal: { text: "Quantity received" } } },
  {
    key: "i-qty",
    component: "NumberInput",
    props: { expr: "({ value: scopes.root.rcvQty, min: 1, step: 1 })" },
    callbacks: { onChange: [{ set: "scopes.root.rcvQty", expr: "evt.value" }] },
  },
  { key: "f-note", component: "Field", children: ["l-note", "i-note"] },
  { key: "l-note", component: "FieldLabel", props: { literal: { text: "Note" } } },
  {
    key: "i-note",
    component: "Input",
    props: { expr: "({ value: scopes.root.rcvNote, placeholder: 'e.g. PO #2214 from Nordform' })" },
    callbacks: { onChange: [{ set: "scopes.root.rcvNote", expr: "evt.value" }] },
  },
  { key: "rcv-actions", component: "FlexRow", props: { literal: { gap: "2", justify: "end" } }, children: ["rcv-cancel", "rcv-save"] },
  {
    key: "rcv-cancel",
    component: "Button",
    props: { literal: { text: "Cancel", variant: "outline" } },
    callbacks: { onClick: [{ set: "scopes.root.rcvOpen", literal: false }] },
  },
  {
    key: "rcv-save",
    component: "Button",
    props: { expr: "({ text: 'Receive ' + scopes.root.rcvQty + ' units' })" },
    callbacks: {
      onClick: [
        { expr: "createStockMovement({ productId: Number(scopes.root.rcvProductId), qty: scopes.root.rcvQty, reason: 'received', note: scopes.root.rcvNote })" },
        { set: "scopes.root.products", expr: "listProducts()" },
        { set: "scopes.root.rcvOpen", literal: false },
        { set: "scopes.root.rcvNote", literal: "" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Page 2 — Sales & revenue
// ---------------------------------------------------------------------------
const salesEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.status", literal: "all" },
      { set: "scopes.root.now", expr: "Date.now()" },
      { set: "scopes.root.orders", expr: "listOrders()" },
      { set: "scopes.root.customers", expr: "listCustomers()" },
    ],
    children: ["title", "subtitle", "stats", "trend-card", "filter", "table-card"],
  },
  { key: "title", component: "Heading", props: { literal: { level: "1", text: "Sales & revenue" } } },
  {
    key: "subtitle",
    component: "Text",
    props: { literal: { text: "Where the money is, and which orders still need a push.", variant: "muted" } },
  },
  { key: "stats", component: "Grid", props: { literal: { columns: "4", gap: "4" } }, children: ["s-rev", "s-aov", "s-week", "s-pending"] },
  {
    key: "s-rev",
    component: "Stat",
    props: {
      expr: "({ label: 'Revenue', value: '$' + Math.round(scopes.root.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)).toLocaleString(), helpText: 'excluding cancelled' })",
    },
  },
  {
    key: "s-aov",
    component: "Stat",
    props: {
      expr: "({ label: 'Avg order', value: '$' + Math.round(scopes.root.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0) / Math.max(1, scopes.root.orders.filter(o => o.status !== 'cancelled').length)).toLocaleString(), helpText: 'per non-cancelled order' })",
    },
  },
  {
    key: "s-week",
    component: "Stat",
    props: {
      expr: "({ label: 'Last 7 days', value: '$' + Math.round(scopes.root.orders.filter(o => o.status !== 'cancelled' && scopes.root.now - new Date(o.createdAt).getTime() <= 7 * 86400000).reduce((s, o) => s + o.total, 0)).toLocaleString(), trend: 'up', helpText: 'rolling week' })",
    },
  },
  {
    key: "s-pending",
    component: "Stat",
    props: {
      expr: "({ label: 'Pending', value: scopes.root.orders.filter(o => o.status === 'pending').length, trend: scopes.root.orders.filter(o => o.status === 'pending').length > 2 ? 'down' : 'neutral', helpText: 'awaiting payment' })",
    },
  },
  { key: "trend-card", component: "Card", props: { literal: { title: "Revenue by day" } }, children: ["trend"] },
  {
    key: "trend",
    component: "AreaChart",
    props: {
      expr: "({ data: Object.entries(scopes.root.orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => ({ ...acc, [o.createdAt.slice(5, 10)]: (acc[o.createdAt.slice(5, 10)] ?? 0) + o.total }), {})).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })).toSorted((a, b) => a.date.localeCompare(b.date)), xKey: 'date', yKeys: ['revenue'], height: 220 })",
    },
  },
  {
    key: "filter",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.status, options: [{ label: 'All statuses', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Paid', value: 'paid' }, { label: 'Shipped', value: 'shipped' }, { label: 'Delivered', value: 'delivered' }, { label: 'Cancelled', value: 'cancelled' }] })",
    },
    callbacks: { onChange: [{ set: "scopes.root.status", expr: "evt.value" }] },
  },
  { key: "table-card", component: "Card", props: { literal: { title: "Orders" } }, children: ["table"] },
  { key: "table", component: "Table", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["hrow"] },
  { key: "hrow", component: "TableRow", children: ["h-id", "h-date", "h-cust", "h-prod", "h-total", "h-status", "h-act"] },
  { key: "h-id", component: "TableHead", props: { literal: { text: "#" } } },
  { key: "h-date", component: "TableHead", props: { literal: { text: "Date" } } },
  { key: "h-cust", component: "TableHead", props: { literal: { text: "Customer" } } },
  { key: "h-prod", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "h-total", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "h-status", component: "TableHead", props: { literal: { text: "Status" } } },
  { key: "h-act", component: "TableHead", props: { literal: { text: "" } } },
  { key: "tbody", component: "TableBody", children: ["row"] },
  {
    key: "row",
    component: "TableRow",
    each: "scopes.root.orders.filter(o => scopes.root.status === 'all' || o.status === scopes.root.status).toSorted((a, b) => b.id - a.id).slice(0, 100)",
    as: "ord",
    keyBy: "id",
    children: ["c-id", "c-date", "c-cust", "c-prod", "c-total", "c-status", "c-act"],
  },
  { key: "c-id", component: "TableCell", props: { expr: "({ text: String(scopes.ord.item.id) })" } },
  { key: "c-date", component: "TableCell", props: { expr: "({ text: scopes.ord.item.createdAt.slice(0, 10) })" } },
  {
    key: "c-cust",
    component: "TableCell",
    props: { expr: "({ text: scopes.root.customers.find(c => c.id === scopes.ord.item.customerId)?.name ?? '—' })" },
  },
  {
    key: "c-prod",
    component: "TableCell",
    props: { expr: "({ text: scopes.ord.item.qty + '× ' + scopes.ord.item.productName })" },
  },
  { key: "c-total", component: "TableCell", props: { expr: "({ text: '$' + scopes.ord.item.total.toFixed(2) })" } },
  { key: "c-status", component: "TableCell", children: ["badge"] },
  {
    key: "badge",
    component: "Badge",
    props: {
      expr: "({ text: scopes.ord.item.status, variant: scopes.ord.item.status === 'cancelled' ? 'destructive' : scopes.ord.item.status === 'pending' ? 'outline' : 'secondary' })",
    },
  },
  { key: "c-act", component: "TableCell", children: ["advance", "cancel"] },
  {
    key: "advance",
    component: "Button",
    props: {
      expr: "({ text: scopes.ord.item.status === 'pending' ? 'Mark paid' : scopes.ord.item.status === 'paid' ? 'Mark shipped' : 'Mark delivered', variant: 'outline', size: 'sm' })",
    },
    hidden: "scopes.ord.item.status === 'delivered' || scopes.ord.item.status === 'cancelled'",
    callbacks: {
      onClick: [
        {
          expr: "updateOrder({ id: scopes.ord.item.id, status: scopes.ord.item.status === 'pending' ? 'paid' : scopes.ord.item.status === 'paid' ? 'shipped' : 'delivered' })",
        },
        { set: "scopes.root.orders", expr: "listOrders()" },
      ],
    },
  },
  {
    key: "cancel",
    component: "IconButton",
    props: { literal: { icon: "X", variant: "ghost", size: "sm", tooltip: "Cancel order" } },
    hidden: "scopes.ord.item.status === 'delivered' || scopes.ord.item.status === 'cancelled'",
    callbacks: {
      onClick: [
        {
          expr: "updateOrder({ id: scopes.ord.item.id, status: 'cancelled' })",
          confirm: "Cancel this order? The customer will not be charged.",
        },
        { set: "scopes.root.orders", expr: "listOrders()" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Page 3 — Customer 360
// ---------------------------------------------------------------------------
const customersEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.q", literal: "" },
      { set: "scopes.root.selectedId", literal: null },
      { set: "scopes.root.addOpen", literal: false },
      { set: "scopes.root.newName", literal: "" },
      { set: "scopes.root.newCompany", literal: "" },
      { set: "scopes.root.newEmail", literal: "" },
      { set: "scopes.root.customers", expr: "listCustomers()" },
      { set: "scopes.root.orders", expr: "listOrders()" },
    ],
    children: ["header", "stats", "search", "table-card", "detail", "add-drawer"],
  },
  {
    key: "header",
    component: "FlexRow",
    props: { literal: { justify: "between", align: "center" } },
    children: ["header-text", "add-btn"],
  },
  { key: "header-text", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["title", "subtitle"] },
  { key: "title", component: "Heading", props: { literal: { level: "1", text: "Customer 360" } } },
  {
    key: "subtitle",
    component: "Text",
    props: { literal: { text: "Every account, its order history, and lifetime value.", variant: "muted" } },
  },
  {
    key: "add-btn",
    component: "Button",
    props: { literal: { text: "Add customer" } },
    callbacks: { onClick: [{ set: "scopes.root.addOpen", literal: true }] },
  },
  { key: "stats", component: "Grid", props: { literal: { columns: "3", gap: "4" } }, children: ["s-count", "s-repeat", "s-top"] },
  {
    key: "s-count",
    component: "Stat",
    props: { expr: "({ label: 'Customers', value: scopes.root.customers.length, helpText: 'accounts on file' })" },
  },
  {
    key: "s-repeat",
    component: "Stat",
    props: {
      expr: "({ label: 'Repeat buyers', value: scopes.root.customers.filter(c => scopes.root.orders.filter(o => o.customerId === c.id && o.status !== 'cancelled').length >= 2).length, helpText: 'two or more orders' })",
    },
  },
  {
    key: "s-top",
    component: "Stat",
    props: {
      expr: "({ label: 'Top account', value: scopes.root.customers.toSorted((a, b) => scopes.root.orders.filter(o => o.customerId === b.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0) - scopes.root.orders.filter(o => o.customerId === a.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0))[0]?.company ?? '—', helpText: 'by lifetime spend' })",
    },
  },
  {
    key: "search",
    component: "SearchInput",
    props: { expr: "({ value: scopes.root.q, placeholder: 'Search by name or company…' })" },
    callbacks: { onChange: [{ set: "scopes.root.q", expr: "evt.value" }] },
  },
  { key: "table-card", component: "Card", props: { literal: { title: "Customers" } }, children: ["table"] },
  { key: "table", component: "Table", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["hrow"] },
  { key: "hrow", component: "TableRow", children: ["h-name", "h-comp", "h-email", "h-orders", "h-spend", "h-act"] },
  { key: "h-name", component: "TableHead", props: { literal: { text: "Name" } } },
  { key: "h-comp", component: "TableHead", props: { literal: { text: "Company" } } },
  { key: "h-email", component: "TableHead", props: { literal: { text: "Email" } } },
  { key: "h-orders", component: "TableHead", props: { literal: { text: "Orders" } } },
  { key: "h-spend", component: "TableHead", props: { literal: { text: "Lifetime" } } },
  { key: "h-act", component: "TableHead", props: { literal: { text: "" } } },
  { key: "tbody", component: "TableBody", children: ["row"] },
  {
    key: "row",
    component: "TableRow",
    each: "scopes.root.customers.filter(c => c.name.toLowerCase().includes(scopes.root.q.toLowerCase()) || c.company.toLowerCase().includes(scopes.root.q.toLowerCase())).slice(0, 100)",
    as: "cust",
    keyBy: "id",
    children: ["c-name", "c-comp", "c-email", "c-orders", "c-spend", "c-act"],
  },
  { key: "c-name", component: "TableCell", props: { expr: "({ text: scopes.cust.item.name })" } },
  { key: "c-comp", component: "TableCell", props: { expr: "({ text: scopes.cust.item.company })" } },
  { key: "c-email", component: "TableCell", props: { expr: "({ text: scopes.cust.item.email })" } },
  {
    key: "c-orders",
    component: "TableCell",
    props: { expr: "({ text: String(scopes.root.orders.filter(o => o.customerId === scopes.cust.item.id).length) })" },
  },
  {
    key: "c-spend",
    component: "TableCell",
    props: {
      expr: "({ text: '$' + scopes.root.orders.filter(o => o.customerId === scopes.cust.item.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0).toFixed(2) })",
    },
  },
  { key: "c-act", component: "TableCell", children: ["view-btn"] },
  {
    key: "view-btn",
    component: "Button",
    props: { literal: { text: "View", variant: "ghost", size: "sm" } },
    callbacks: { onClick: [{ set: "scopes.root.selectedId", expr: "scopes.cust.item.id" }] },
  },
  // Selected-customer detail: their orders, newest first.
  {
    key: "detail",
    component: "Card",
    props: {
      expr: "({ title: (scopes.root.customers.find(c => c.id === scopes.root.selectedId)?.name ?? '') + ' — order history', description: scopes.root.customers.find(c => c.id === scopes.root.selectedId)?.company ?? '' })",
    },
    hidden: "scopes.root.selectedId === null",
    children: ["detail-close", "d-table"],
  },
  {
    key: "detail-close",
    component: "Button",
    props: { literal: { text: "Close", variant: "ghost", size: "sm" } },
    callbacks: { onClick: [{ set: "scopes.root.selectedId", literal: null }] },
  },
  { key: "d-table", component: "Table", children: ["d-head", "d-body"] },
  { key: "d-head", component: "TableHeader", children: ["d-hrow"] },
  { key: "d-hrow", component: "TableRow", children: ["dh-date", "dh-prod", "dh-total", "dh-status"] },
  { key: "dh-date", component: "TableHead", props: { literal: { text: "Date" } } },
  { key: "dh-prod", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "dh-total", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "dh-status", component: "TableHead", props: { literal: { text: "Status" } } },
  { key: "d-body", component: "TableBody", children: ["d-row"] },
  {
    key: "d-row",
    component: "TableRow",
    each: "scopes.root.orders.filter(o => o.customerId === scopes.root.selectedId).toSorted((a, b) => b.id - a.id)",
    as: "dord",
    keyBy: "id",
    children: ["dc-date", "dc-prod", "dc-total", "dc-status"],
  },
  { key: "dc-date", component: "TableCell", props: { expr: "({ text: scopes.dord.item.createdAt.slice(0, 10) })" } },
  {
    key: "dc-prod",
    component: "TableCell",
    props: { expr: "({ text: scopes.dord.item.qty + '× ' + scopes.dord.item.productName })" },
  },
  { key: "dc-total", component: "TableCell", props: { expr: "({ text: '$' + scopes.dord.item.total.toFixed(2) })" } },
  { key: "dc-status", component: "TableCell", props: { expr: "({ text: scopes.dord.item.status })" } },
  // Add-customer drawer.
  {
    key: "add-drawer",
    component: "Drawer",
    props: { expr: "({ open: scopes.root.addOpen, title: 'Add customer', side: 'right' })" },
    callbacks: { onOpenChange: [{ set: "scopes.root.addOpen", expr: "evt.open" }] },
    children: ["add-form"],
  },
  { key: "add-form", component: "FlexCol", props: { literal: { gap: "4" } }, children: ["af-name", "af-comp", "af-email", "add-actions"] },
  { key: "af-name", component: "Field", children: ["al-name", "ai-name"] },
  { key: "al-name", component: "FieldLabel", props: { literal: { text: "Full name" } } },
  {
    key: "ai-name",
    component: "Input",
    props: { expr: "({ value: scopes.root.newName, placeholder: 'Ada Lindqvist' })" },
    callbacks: { onChange: [{ set: "scopes.root.newName", expr: "evt.value" }] },
  },
  { key: "af-comp", component: "Field", children: ["al-comp", "ai-comp"] },
  { key: "al-comp", component: "FieldLabel", props: { literal: { text: "Company" } } },
  {
    key: "ai-comp",
    component: "Input",
    props: { expr: "({ value: scopes.root.newCompany, placeholder: 'Northwind Labs' })" },
    callbacks: { onChange: [{ set: "scopes.root.newCompany", expr: "evt.value" }] },
  },
  { key: "af-email", component: "Field", children: ["al-email", "ai-email"] },
  { key: "al-email", component: "FieldLabel", props: { literal: { text: "Email" } } },
  {
    key: "ai-email",
    component: "Input",
    props: { expr: "({ value: scopes.root.newEmail, type: 'email', placeholder: 'ada@northwind.dev' })" },
    callbacks: { onChange: [{ set: "scopes.root.newEmail", expr: "evt.value" }] },
  },
  { key: "add-actions", component: "FlexRow", props: { literal: { gap: "2", justify: "end" } }, children: ["add-cancel", "add-save"] },
  {
    key: "add-cancel",
    component: "Button",
    props: { literal: { text: "Cancel", variant: "outline" } },
    callbacks: { onClick: [{ set: "scopes.root.addOpen", literal: false }] },
  },
  {
    key: "add-save",
    component: "Button",
    props: { literal: { text: "Save customer" } },
    callbacks: {
      onClick: [
        { expr: "createCustomer({ name: scopes.root.newName, company: scopes.root.newCompany, email: scopes.root.newEmail })" },
        { set: "scopes.root.customers", expr: "listCustomers()" },
        { set: "scopes.root.addOpen", literal: false },
        { set: "scopes.root.newName", literal: "" },
        { set: "scopes.root.newCompany", literal: "" },
        { set: "scopes.root.newEmail", literal: "" },
      ],
    },
  },
];


export const SEED_PAGES: { title: string; prompt: string; entries: ComponentEntry[]; usage: SeedUsage }[] = [
  {
    title: "Inventory & restock",
    usage: { inputTokens: 24800, outputTokens: 4300, costUsd: 0.2315 },
    prompt:
      "An inventory dashboard: stock stats, units and value by category, a searchable product table with supplier lead times, and a drawer to receive stock into the ledger.",
    entries: inventoryEntries,
  },
  {
    title: "Sales & revenue",
    usage: { inputTokens: 24100, outputTokens: 3200, costUsd: 0.2005 },
    prompt:
      "A sales overview: revenue stats, a revenue-by-day chart, and an orders table with status filters, one-click status advancement, and cancellation with confirmation.",
    entries: salesEntries,
  },
  {
    title: "Customer 360",
    usage: { inputTokens: 24600, outputTokens: 3900, costUsd: 0.2205 },
    prompt:
      "A CRM view: customer stats, a searchable account list with lifetime value, per-customer order history, and a drawer to add accounts.",
    entries: customersEntries,
  },
];

// ---------------------------------------------------------------------------
// Chats — multi-turn exchanges whose answers carry live uicast fences.
// All fences in a chat share one root scope, so seeded paths are reused
// (first writer wins) and later fences derive from the same data.
// ---------------------------------------------------------------------------

const j = (entries: object[]) => entries.map((e) => JSON.stringify(e)).join("\n");

const lowStockFence = j([
  { key: "low-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.products", expr: "listProducts()" }, { set: "scopes.root.suppliers", expr: "listSuppliers()" }], children: ["low-stat", "low-table"] },
  { key: "low-stat", component: "Stat", props: { expr: "({ label: 'Products at or below 20 units', value: scopes.root.products.filter(p => p.stock <= 20).length })" } },
  { key: "low-table", component: "Table", children: ["low-head", "low-body"] },
  { key: "low-head", component: "TableHeader", children: ["low-hrow"] },
  { key: "low-hrow", component: "TableRow", children: ["low-h1", "low-h2", "low-h3", "low-h4"] },
  { key: "low-h1", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "low-h2", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "low-h3", component: "TableHead", props: { literal: { text: "Supplier" } } },
  { key: "low-h4", component: "TableHead", props: { literal: { text: "Lead time" } } },
  { key: "low-row", component: "TableRow", each: "scopes.root.products.filter(p => p.stock <= 20).toSorted((a, b) => a.stock - b.stock)", as: "lp", keyBy: "id", children: ["low-c1", "low-c2", "low-c3", "low-c4"] },
  { key: "low-body", component: "TableBody", children: ["low-row"] },
  { key: "low-c1", component: "TableCell", props: { expr: "({ text: scopes.lp.item.name })" } },
  { key: "low-c2", component: "TableCell", props: { expr: "({ text: String(scopes.lp.item.stock) })" } },
  { key: "low-c3", component: "TableCell", props: { expr: "({ text: scopes.root.suppliers.find(s => s.id === scopes.lp.item.supplierId)?.name ?? '—' })" } },
  { key: "low-c4", component: "TableCell", props: { expr: "({ text: (scopes.root.suppliers.find(s => s.id === scopes.lp.item.supplierId)?.leadTimeDays ?? 0) + ' days' })" } },
]);

const restockCostFence = j([
  { key: "cost-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.products", expr: "listProducts()" }], children: ["cost-total", "cost-table"] },
  { key: "cost-total", component: "Stat", props: { expr: "({ label: 'Total to reach 60 units everywhere', value: '$' + Math.round(scopes.root.products.filter(p => p.stock < 60).reduce((s, p) => s + (60 - p.stock) * p.price, 0)).toLocaleString(), helpText: 'at list price — wholesale will be lower' })" } },
  { key: "cost-table", component: "Table", children: ["cost-head", "cost-body"] },
  { key: "cost-head", component: "TableHeader", children: ["cost-hrow"] },
  { key: "cost-hrow", component: "TableRow", children: ["cost-h1", "cost-h2", "cost-h3", "cost-h4"] },
  { key: "cost-h1", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "cost-h2", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "cost-h3", component: "TableHead", props: { literal: { text: "Units needed" } } },
  { key: "cost-h4", component: "TableHead", props: { literal: { text: "Cost" } } },
  { key: "cost-body", component: "TableBody", children: ["cost-row"] },
  { key: "cost-row", component: "TableRow", each: "scopes.root.products.filter(p => p.stock < 60).toSorted((a, b) => (60 - b.stock) * b.price - (60 - a.stock) * a.price)", as: "cp", keyBy: "id", children: ["cost-c1", "cost-c2", "cost-c3", "cost-c4"] },
  { key: "cost-c1", component: "TableCell", props: { expr: "({ text: scopes.cp.item.name })" } },
  { key: "cost-c2", component: "TableCell", props: { expr: "({ text: String(scopes.cp.item.stock) })" } },
  { key: "cost-c3", component: "TableCell", props: { expr: "({ text: String(60 - scopes.cp.item.stock) })" } },
  { key: "cost-c4", component: "TableCell", props: { expr: "({ text: '$' + ((60 - scopes.cp.item.stock) * scopes.cp.item.price).toLocaleString() })" } },
]);

const poPlanFence = j([
  { key: "po-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.products", expr: "listProducts()" }, { set: "scopes.root.suppliers", expr: "listSuppliers()" }], children: ["po-table", "po-note"] },
  { key: "po-table", component: "Table", children: ["po-head", "po-body"] },
  { key: "po-head", component: "TableHeader", children: ["po-hrow"] },
  { key: "po-hrow", component: "TableRow", children: ["po-h1", "po-h2", "po-h3", "po-h4"] },
  { key: "po-h1", component: "TableHead", props: { literal: { text: "Supplier" } } },
  { key: "po-h2", component: "TableHead", props: { literal: { text: "Lead time" } } },
  { key: "po-h3", component: "TableHead", props: { literal: { text: "Units" } } },
  { key: "po-h4", component: "TableHead", props: { literal: { text: "Est. cost" } } },
  { key: "po-body", component: "TableBody", children: ["po-row"] },
  { key: "po-row", component: "TableRow", each: "scopes.root.suppliers.filter(s => scopes.root.products.some(p => p.supplierId === s.id && p.stock < 60)).toSorted((a, b) => b.leadTimeDays - a.leadTimeDays)", as: "sup", keyBy: "id", children: ["po-c1", "po-c2", "po-c3", "po-c4"] },
  { key: "po-c1", component: "TableCell", props: { expr: "({ text: scopes.sup.item.name })" } },
  { key: "po-c2", component: "TableCell", children: ["po-lead-badge"] },
  { key: "po-lead-badge", component: "Badge", props: { expr: "({ text: scopes.sup.item.leadTimeDays + ' days', variant: scopes.sup.item.leadTimeDays >= 14 ? 'destructive' : 'secondary' })" } },
  { key: "po-c3", component: "TableCell", props: { expr: "({ text: String(scopes.root.products.filter(p => p.supplierId === scopes.sup.item.id && p.stock < 60).reduce((s, p) => s + (60 - p.stock), 0)) })" } },
  { key: "po-c4", component: "TableCell", props: { expr: "({ text: '$' + Math.round(scopes.root.products.filter(p => p.supplierId === scopes.sup.item.id && p.stock < 60).reduce((s, p) => s + (60 - p.stock) * p.price, 0)).toLocaleString() })" } },
  { key: "po-note", component: "Text", props: { literal: { text: "Sorted by lead time — longest first, so the slowest PO goes out today.", variant: "muted" } } },
]);

const receiveCardFence = j([
  { key: "rcv-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.products", expr: "listProducts()" }, { set: "scopes.root.shelfQty", literal: 52 }], children: ["rcv-card"] },
  { key: "rcv-card", component: "Card", props: { literal: { title: "Receive: Walnut Bookshelf", description: "Writes a movement into the ledger and bumps the stock count." } }, children: ["rcv-stat", "rcv-row"] },
  { key: "rcv-stat", component: "Stat", props: { expr: "({ label: 'In stock right now', value: scopes.root.products.find(p => p.sku === 'SKU-SHLF-12')?.stock ?? 0, helpText: 'updates the moment the delivery is booked' })" } },
  { key: "rcv-row", component: "FlexRow", props: { literal: { gap: "2", align: "end" } }, children: ["rcv-qty-field", "rcv-go"] },
  { key: "rcv-qty-field", component: "Field", children: ["rcv-label", "rcv-qty"] },
  { key: "rcv-label", component: "FieldLabel", props: { literal: { text: "Units received" } } },
  { key: "rcv-qty", component: "NumberInput", props: { expr: "({ value: scopes.root.shelfQty, min: 1, step: 1 })" }, callbacks: { onChange: [{ set: "scopes.root.shelfQty", expr: "evt.value" }] } },
  { key: "rcv-go", component: "Button", props: { expr: "({ text: 'Receive ' + scopes.root.shelfQty + ' units' })" }, callbacks: { onClick: [
    { expr: "createStockMovement({ productId: scopes.root.products.find(p => p.sku === 'SKU-SHLF-12')?.id ?? 0, qty: scopes.root.shelfQty, reason: 'received', note: 'PO from chat' })" },
    { set: "scopes.root.products", expr: "listProducts()" },
  ] } },
])

const revenueFence = j([
  { key: "rev-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.orders", expr: "listOrders()" }], children: ["rev-stats", "rev-chart"] },
  { key: "rev-stats", component: "Grid", props: { literal: { columns: "3", gap: "4" } }, children: ["rev-total", "rev-aov", "rev-open"] },
  { key: "rev-total", component: "Stat", props: { expr: "({ label: 'Revenue', value: '$' + Math.round(scopes.root.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)).toLocaleString(), helpText: 'all time, excl. cancelled' })" } },
  { key: "rev-aov", component: "Stat", props: { expr: "({ label: 'Avg order', value: '$' + Math.round(scopes.root.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0) / Math.max(1, scopes.root.orders.filter(o => o.status !== 'cancelled').length)).toLocaleString() })" } },
  { key: "rev-open", component: "Stat", props: { expr: "({ label: 'Open orders', value: scopes.root.orders.filter(o => o.status === 'pending' || o.status === 'paid').length, helpText: 'pending + paid' })" } },
  { key: "rev-chart", component: "BarChart", props: { expr: "({ data: Object.entries(scopes.root.orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + o.total }), {})).map(([name, value]) => ({ name, value: Math.round(value) })), xKey: 'name', yKeys: ['value'], height: 200 })" } },
]);

const topCustomersFence = j([
  { key: "top-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.orders", expr: "listOrders()" }, { set: "scopes.root.customers", expr: "listCustomers()" }], children: ["top-table"] },
  { key: "top-table", component: "Table", children: ["top-head", "top-body"] },
  { key: "top-head", component: "TableHeader", children: ["top-hrow"] },
  { key: "top-hrow", component: "TableRow", children: ["top-h1", "top-h2", "top-h3", "top-h4"] },
  { key: "top-h1", component: "TableHead", props: { literal: { text: "#" } } },
  { key: "top-h2", component: "TableHead", props: { literal: { text: "Account" } } },
  { key: "top-h3", component: "TableHead", props: { literal: { text: "Orders" } } },
  { key: "top-h4", component: "TableHead", props: { literal: { text: "Lifetime" } } },
  { key: "top-body", component: "TableBody", children: ["top-row"] },
  { key: "top-row", component: "TableRow", each: "scopes.root.customers.toSorted((a, b) => scopes.root.orders.filter(o => o.customerId === b.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0) - scopes.root.orders.filter(o => o.customerId === a.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)).slice(0, 3)", as: "tc", keyBy: "id", children: ["top-c1", "top-c2", "top-c3", "top-c4"] },
  { key: "top-c1", component: "TableCell", props: { expr: "({ text: String(scopes.tc.index + 1) })" } },
  { key: "top-c2", component: "TableCell", props: { expr: "({ text: scopes.tc.item.name + ' — ' + scopes.tc.item.company })" } },
  { key: "top-c3", component: "TableCell", props: { expr: "({ text: String(scopes.root.orders.filter(o => o.customerId === scopes.tc.item.id && o.status !== 'cancelled').length) })" } },
  { key: "top-c4", component: "TableCell", props: { expr: "({ text: '$' + scopes.root.orders.filter(o => o.customerId === scopes.tc.item.id && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0).toFixed(2) })" } },
]);

const agingFence = j([
  { key: "age-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.orders", expr: "listOrders()" }, { set: "scopes.root.customers", expr: "listCustomers()" }, { set: "scopes.root.now", expr: "Date.now()" }], children: ["age-table"] },
  { key: "age-table", component: "Table", children: ["age-head", "age-body"] },
  { key: "age-head", component: "TableHeader", children: ["age-hrow"] },
  { key: "age-hrow", component: "TableRow", children: ["age-h1", "age-h2", "age-h3", "age-h4", "age-h5"] },
  { key: "age-h1", component: "TableHead", props: { literal: { text: "Order" } } },
  { key: "age-h2", component: "TableHead", props: { literal: { text: "Customer" } } },
  { key: "age-h3", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "age-h4", component: "TableHead", props: { literal: { text: "Waiting" } } },
  { key: "age-h5", component: "TableHead", props: { literal: { text: "" } } },
  { key: "age-body", component: "TableBody", children: ["age-row"] },
  { key: "age-row", component: "TableRow", each: "scopes.root.orders.filter(o => o.status === 'pending').toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))", as: "po", keyBy: "id", children: ["age-c1", "age-c2", "age-c3", "age-c4", "age-c5"] },
  { key: "age-c1", component: "TableCell", props: { expr: "({ text: '#' + scopes.po.item.id + ' · ' + scopes.po.item.productName })" } },
  { key: "age-c2", component: "TableCell", props: { expr: "({ text: scopes.root.customers.find(c => c.id === scopes.po.item.customerId)?.company ?? '—' })" } },
  { key: "age-c3", component: "TableCell", props: { expr: "({ text: '$' + scopes.po.item.total.toFixed(2) })" } },
  { key: "age-c4", component: "TableCell", children: ["age-badge"] },
  { key: "age-badge", component: "Badge", props: { expr: "({ text: Math.round((scopes.root.now - new Date(scopes.po.item.createdAt).getTime()) / 86400000) + ' days', variant: (scopes.root.now - new Date(scopes.po.item.createdAt).getTime()) / 86400000 >= 3 ? 'destructive' : 'secondary' })" } },
  { key: "age-c5", component: "TableCell", children: ["age-pay"] },
  { key: "age-pay", component: "Button", props: { literal: { text: "Mark paid", variant: "outline", size: "sm" } }, callbacks: { onClick: [
    { expr: "updateOrder({ id: scopes.po.item.id, status: 'paid' })" },
    { set: "scopes.root.orders", expr: "listOrders()" },
  ] } },
]);


const addProductFence = j([
  { key: "ap-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [
    { set: "scopes.root.products", expr: "listProducts()" },
    { set: "scopes.root.suppliers", expr: "listSuppliers()" },
    { set: "scopes.root.npOpen", literal: false },
    { set: "scopes.root.npName", literal: "" },
    { set: "scopes.root.npSku", literal: "" },
    { set: "scopes.root.npCategory", literal: "Accessories" },
    { set: "scopes.root.npSupplierId", literal: "" },
    { set: "scopes.root.npStock", literal: 0 },
    { set: "scopes.root.npPrice", literal: 0 },
  ], children: ["ap-card", "ap-drawer"] },
  { key: "ap-card", component: "Card", props: { literal: { title: "Catalog", description: "The three newest products — this list re-reads after every save." } }, children: ["ap-head", "ap-latest"] },
  { key: "ap-head", component: "FlexRow", props: { literal: { justify: "between", align: "center" } }, children: ["ap-stat", "ap-open"] },
  { key: "ap-stat", component: "Stat", props: { expr: "({ label: 'Products', value: scopes.root.products.length })" } },
  { key: "ap-open", component: "Button", props: { literal: { text: "Add product" } }, callbacks: { onClick: [{ set: "scopes.root.npOpen", literal: true }] } },
  { key: "ap-latest", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["ap-line"] },
  { key: "ap-line", component: "Text", each: "scopes.root.products.toSorted((a, b) => b.id - a.id).slice(0, 3)", as: "np", keyBy: "id", props: { expr: "({ text: scopes.np.item.name + ' — ' + scopes.np.item.sku + ' — $' + scopes.np.item.price.toFixed(2), variant: 'muted' })" } },
  { key: "ap-drawer", component: "Drawer", props: { expr: "({ open: scopes.root.npOpen, title: 'New product', description: 'Saved through the same API the rest of the app uses.', side: 'right' })" }, callbacks: { onOpenChange: [{ set: "scopes.root.npOpen", expr: "evt.open" }] }, children: ["ap-form"] },
  { key: "ap-form", component: "FlexCol", props: { literal: { gap: "4" } }, children: ["apf-name", "apf-sku", "apf-cat", "apf-sup", "apf-stock", "apf-price", "ap-actions"] },
  { key: "apf-name", component: "Field", children: ["apl-name", "api-name"] },
  { key: "apl-name", component: "FieldLabel", props: { literal: { text: "Name" } } },
  { key: "api-name", component: "Input", props: { expr: "({ value: scopes.root.npName, placeholder: 'Oak Monitor Riser' })" }, callbacks: { onChange: [{ set: "scopes.root.npName", expr: "evt.value" }] } },
  { key: "apf-sku", component: "Field", children: ["apl-sku", "api-sku"] },
  { key: "apl-sku", component: "FieldLabel", props: { literal: { text: "SKU" } } },
  { key: "api-sku", component: "Input", props: { expr: "({ value: scopes.root.npSku, placeholder: 'SKU-RISE-13' })" }, callbacks: { onChange: [{ set: "scopes.root.npSku", expr: "evt.value" }] } },
  { key: "apf-cat", component: "Field", children: ["apl-cat", "api-cat"] },
  { key: "apl-cat", component: "FieldLabel", props: { literal: { text: "Category" } } },
  { key: "api-cat", component: "Select", props: { expr: "({ value: scopes.root.npCategory, options: [{ label: 'Lighting', value: 'Lighting' }, { label: 'Furniture', value: 'Furniture' }, { label: 'Electronics', value: 'Electronics' }, { label: 'Accessories', value: 'Accessories' }] })" }, callbacks: { onChange: [{ set: "scopes.root.npCategory", expr: "evt.value" }] } },
  { key: "apf-sup", component: "Field", children: ["apl-sup", "api-sup"] },
  { key: "apl-sup", component: "FieldLabel", props: { literal: { text: "Supplier" } } },
  { key: "api-sup", component: "Select", props: { expr: "({ value: scopes.root.npSupplierId, placeholder: 'Pick a supplier', options: scopes.root.suppliers.map(s => ({ label: s.name + ' (' + s.leadTimeDays + 'd)', value: String(s.id) })) })" }, callbacks: { onChange: [{ set: "scopes.root.npSupplierId", expr: "evt.value" }] } },
  { key: "apf-stock", component: "Field", children: ["apl-stock", "api-stock"] },
  { key: "apl-stock", component: "FieldLabel", props: { literal: { text: "Opening stock" } } },
  { key: "api-stock", component: "NumberInput", props: { expr: "({ value: scopes.root.npStock, min: 0, step: 1 })" }, callbacks: { onChange: [{ set: "scopes.root.npStock", expr: "evt.value" }] } },
  { key: "apf-price", component: "Field", children: ["apl-price", "api-price"] },
  { key: "apl-price", component: "FieldLabel", props: { literal: { text: "Price (USD)" } } },
  { key: "api-price", component: "NumberInput", props: { expr: "({ value: scopes.root.npPrice, min: 0, step: 1 })" }, callbacks: { onChange: [{ set: "scopes.root.npPrice", expr: "evt.value" }] } },
  { key: "ap-actions", component: "FlexRow", props: { literal: { gap: "2", justify: "end" } }, children: ["ap-cancel", "ap-save"] },
  { key: "ap-cancel", component: "Button", props: { literal: { text: "Cancel", variant: "outline" } }, callbacks: { onClick: [{ set: "scopes.root.npOpen", literal: false }] } },
  { key: "ap-save", component: "Button", props: { literal: { text: "Save product" } }, callbacks: { onClick: [
    { expr: "createProduct({ name: scopes.root.npName, sku: scopes.root.npSku, category: scopes.root.npCategory, supplierId: Number(scopes.root.npSupplierId), stock: scopes.root.npStock, price: scopes.root.npPrice })" },
    { set: "scopes.root.products", expr: "listProducts()" },
    { set: "scopes.root.npOpen", literal: false },
    { set: "scopes.root.npName", literal: "" },
    { set: "scopes.root.npSku", literal: "" },
  ] } },
]);

const quickRestockFence = j([
  { key: "qr-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.products", expr: "listProducts()" }], children: ["qr-table"] },
  { key: "qr-table", component: "Table", children: ["qr-head", "qr-body"] },
  { key: "qr-head", component: "TableHeader", children: ["qr-hrow"] },
  { key: "qr-hrow", component: "TableRow", children: ["qr-h1", "qr-h2", "qr-h3"] },
  { key: "qr-h1", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "qr-h2", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "qr-h3", component: "TableHead", props: { literal: { text: "" } } },
  { key: "qr-body", component: "TableBody", children: ["qr-row"] },
  { key: "qr-row", component: "TableRow", each: "scopes.root.products.filter(p => p.stock <= 25).toSorted((a, b) => a.stock - b.stock)", as: "qp", keyBy: "id", children: ["qr-c1", "qr-c2", "qr-c3"] },
  { key: "qr-c1", component: "TableCell", props: { expr: "({ text: scopes.qp.item.name })" } },
  { key: "qr-c2", component: "TableCell", children: ["qr-badge"] },
  { key: "qr-badge", component: "Badge", props: { expr: "({ text: scopes.qp.item.stock, variant: scopes.qp.item.stock <= 10 ? 'destructive' : 'outline' })" } },
  { key: "qr-c3", component: "TableCell", children: ["qr-btn"] },
  { key: "qr-btn", component: "Button", props: { literal: { text: "Receive 25", variant: "outline", size: "sm" } }, callbacks: { onClick: [
    { expr: "createStockMovement({ productId: scopes.qp.item.id, qty: 25, reason: 'received', note: 'Quick restock from chat' })" },
    { set: "scopes.root.products", expr: "listProducts()" },
  ] } },
]);

const guardedCancelFence = j([
  { key: "gc-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.orders", expr: "listOrders()" }, { set: "scopes.root.customers", expr: "listCustomers()" }], children: ["gc-table"] },
  { key: "gc-table", component: "Table", children: ["gc-head", "gc-body"] },
  { key: "gc-head", component: "TableHeader", children: ["gc-hrow"] },
  { key: "gc-hrow", component: "TableRow", children: ["gc-h1", "gc-h2", "gc-h3", "gc-h4"] },
  { key: "gc-h1", component: "TableHead", props: { literal: { text: "Order" } } },
  { key: "gc-h2", component: "TableHead", props: { literal: { text: "Customer" } } },
  { key: "gc-h3", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "gc-h4", component: "TableHead", props: { literal: { text: "" } } },
  { key: "gc-body", component: "TableBody", children: ["gc-row"] },
  { key: "gc-row", component: "TableRow", each: "scopes.root.orders.filter(o => o.status === 'pending').toSorted((a, b) => b.id - a.id)", as: "go", keyBy: "id", children: ["gc-c1", "gc-c2", "gc-c3", "gc-c4"] },
  { key: "gc-c1", component: "TableCell", props: { expr: "({ text: '#' + scopes.go.item.id + ' · ' + scopes.go.item.qty + '\u00d7 ' + scopes.go.item.productName })" } },
  { key: "gc-c2", component: "TableCell", props: { expr: "({ text: scopes.root.customers.find(c => c.id === scopes.go.item.customerId)?.company ?? '\u2014' })" } },
  { key: "gc-c3", component: "TableCell", props: { expr: "({ text: '$' + scopes.go.item.total.toFixed(2) })" } },
  { key: "gc-c4", component: "TableCell", children: ["gc-btn"] },
  { key: "gc-btn", component: "Button", props: { literal: { text: "Cancel order", variant: "destructive", size: "sm" } }, callbacks: { onClick: [
    { expr: "updateOrder({ id: scopes.go.item.id, status: 'cancelled' })", confirm: "Cancel this order? The customer will not be charged, and the row moves out of the pending queue." },
    { set: "scopes.root.orders", expr: "listOrders()" },
  ] } },
]);

export const SEED_CHATS: {
  id: string;
  title: string;
  turns: { role: "user" | "assistant"; text: string; usage?: SeedUsage }[];
}[] = [
  {
    id: "seed-chat-restock",
    title: "Restock planning for the fall push",
    turns: [
      {
        role: "user",
        text: "We're heading into the fall push. Which products are running low, and who supplies them?",
      },
      {
        role: "assistant",
        usage: { inputTokens: 23600, outputTokens: 620, costUsd: 0.1335 },
        text: `Three products are at or below 20 units:\n\n\`\`\`uicast\n${lowStockFence}\n\`\`\`\n\nThe one to worry about is the **Birch Standing Desk** — Nordform Werk runs a 21-day lead time, so an order placed today lands right at the start of the push. The other two have a week or less of lead.`,
      },
      {
        role: "user",
        text: "What would it cost to bring everything that's under 60 units back up to 60?",
      },
      {
        role: "assistant",
        usage: { inputTokens: 25200, outputTokens: 540, costUsd: 0.1395 },
        text: `Here's the bill, biggest line first:\n\n\`\`\`uicast\n${restockCostFence}\n\`\`\`\n\nTwo caveats: these are list prices, so the real POs should come in 30–45% lower at wholesale — and the desk line dominates because of its unit price, not its unit count.`,
      },
      {
        role: "user",
        text: "Fine, assume we do all of it. Draft the receiving plan by supplier so I can send the POs.",
      },
      {
        role: "assistant",
        usage: { inputTokens: 26900, outputTokens: 580, costUsd: 0.149 },
        text: `Grouped by supplier, slowest lead first:\n\n\`\`\`uicast\n${poPlanFence}\n\`\`\`\n\nSend **Nordform Werk today** — nothing else is time-critical. Once the goods arrive, log them with the *Receive stock* drawer on the Inventory page so the ledger stays reconciled.`,
      },
      {
        role: "user",
        text: "The bookshelf delivery just arrived early, actually — 52 boxes on the dock. Book it in for me.",
      },
      {
        role: "assistant",
        usage: { inputTokens: 28400, outputTokens: 410, costUsd: 0.1523 },
        text: `Here you go — adjust the count if the dock miscounted, then book it:\n\n\`\`\`uicast\n${receiveCardFence}\n\`\`\`\n\nThe stat above is live: it re-reads the catalog the moment the movement lands, so you'll see the stock jump when you click.`,
      },
    ],
  },
  {
    id: "seed-chat-revenue",
    title: "Monday revenue review",
    turns: [
      { role: "user", text: "Morning. Give me the revenue picture for the standup." },
      {
        role: "assistant",
        usage: { inputTokens: 23400, outputTokens: 480, costUsd: 0.129 },
        text: `Here's the headline view:\n\n\`\`\`uicast\n${revenueFence}\n\`\`\`\n\nDelivered orders carry most of the total, and the open pipeline (pending + paid) is healthy. Nothing alarming in the mix.`,
      },
      { role: "user", text: "Who are our top three accounts right now?" },
      {
        role: "assistant",
        usage: { inputTokens: 24800, outputTokens: 510, costUsd: 0.1368 },
        text: `By lifetime spend, excluding cancellations:\n\n\`\`\`uicast\n${topCustomersFence}\n\`\`\`\n\nWorth noting the top account got there on furniture — high ticket, low frequency. A repeat order there moves the quarter more than five accessory sales.`,
      },
      {
        role: "user",
        text: "Anything stuck? I don't want another aging-pending situation like July.",
      },
      {
        role: "assistant",
        usage: { inputTokens: 26300, outputTokens: 540, costUsd: 0.145 },
        text: `Current pending queue, oldest first — with the fix built in:\n\n\`\`\`uicast\n${agingFence}\n\`\`\`\n\nAnything in red has been waiting three days or more. The **Mark paid** buttons are live: click one and the row drops out of this queue, because the table re-reads the orders after the update.`,
      },
    ],
  },
  {
    id: "seed-chat-actions",
    title: "Can chat actually do things?",
    turns: [
      {
        role: "user",
        text: "Honest question — is this just pretty reports, or can I actually DO things from chat?",
      },
      {
        role: "assistant",
        usage: { inputTokens: 23100, outputTokens: 830, costUsd: 0.1363 },
        text: `It's a working app surface, not a rendering. Try it — the button opens a real form:\n\n\`\`\`uicast\n${addProductFence}\n\`\`\`\n\nThe drawer, the inputs, the supplier dropdown and the save all run against the same API as the rest of the app. Save something and watch the catalog list above pick it up.`,
      },
      {
        role: "user",
        text: "Okay, that's a form. Now give me one-click restock for whatever's running low.",
      },
      {
        role: "assistant",
        usage: { inputTokens: 24900, outputTokens: 560, costUsd: 0.1385 },
        text: `One click per row — each button books 25 units into the stock ledger and the badge updates in place:\n\n\`\`\`uicast\n${quickRestockFence}\n\`\`\`\n\nRows leave the list on their own once they cross 25 units, because the table is a live filter over the catalog.`,
      },
      {
        role: "user",
        text: "Last one: something destructive. I want to see the guardrail.",
      },
      {
        role: "assistant",
        usage: { inputTokens: 26500, outputTokens: 520, costUsd: 0.1455 },
        text: `Cancelling an order asks first — click one:\n\n\`\`\`uicast\n${guardedCancelFence}\n\`\`\`\n\nThe confirmation is part of the callback itself: decline it and nothing after it runs, accept it and the update lands and the queue re-reads.`,
      },
    ],
  },
];

/** Insert the default pages and chats for `userId`. `chatId` maps the canonical seed chat ids (the demo user keeps them; new users get fresh ones). */
export async function insertSeedContent(
  userId: string,
  chatId: (baseId: string) => string,
): Promise<void> {
  for (const page of SEED_PAGES) {
    const [row] = await db
      .insert(pages)
      .values({ userId, title: page.title, prompt: page.prompt, ...page.usage })
      .returning();
    await db
      .insert(componentEntries)
      .values(page.entries.map((entry) => ({ pageId: row.id, data: entry })));
  }
  for (const chat of SEED_CHATS) {
    const id = chatId(chat.id);
    await db.insert(chats).values({ id, userId, title: chat.title });
    await db.insert(chatMessages).values(
      chat.turns.map((turn, i) => ({
        chatId: id,
        messageId: `${id}-${i}`,
        role: turn.role,
        parts: [{ type: "text", text: turn.text }],
        metadata: turn.usage ? { ...turn.usage, model: SEED_MODEL } : null,
      })),
    );
  }
}

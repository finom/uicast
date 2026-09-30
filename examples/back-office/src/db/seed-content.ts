// biome-ignore-all format: one entry or row per line
import type { ComponentEntry } from "@uicast/core";
import { priceUsd } from "@/lib/pricing";
import { db } from "./index";
import { chatMessages, chats } from "./schema";
import { opsConsoleEntries } from "./seed-ops-console";
import { slowSeedsEntries } from "./seed-slow-seeds";

// The demo user's pages and chats. New accounts start empty.

// What a generation cost, and the model that ran it.
type SeedUsage = { inputTokens: number; outputTokens: number; costUsd: number; model: string };
const OPUS = "anthropic/claude-opus-5.5";

// Priced like a live run: the prompt is written to the cache, except the `cached` tokens a chat's later reply
// reads back from its previous reply's prompt.
const run = (inputTokens: number, outputTokens: number, cached = 0): SeedUsage => ({
  inputTokens,
  outputTokens,
  costUsd: priceUsd(OPUS, { input: 0, output: outputTokens, cacheRead: cached, cacheWrite: inputTokens - cached }) ?? 0,
  model: OPUS,
});

const inventoryEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.q", literal: "" },
      { set: "scopes.root.cat", literal: "all" },
      { set: "scopes.root.sortKey", literal: "name" },
      { set: "scopes.root.sortDesc", literal: false },
      { set: "scopes.root.lowOnly", literal: false },
      { set: "scopes.root.page", literal: 1 },
      { set: "scopes.root.busy", literal: false },
      { set: "scopes.root.openId", literal: null },
      { set: "scopes.root.moves", literal: { items: [], total: 0 } },
      { set: "scopes.root.rcvOpen", literal: false },
      { set: "scopes.root.rcvProductId", literal: "" },
      { set: "scopes.root.rcvQty", literal: 10 },
      { set: "scopes.root.rcvNote", literal: "" },
      { set: "scopes.root.summary", expr: "getStockSummary()" },
      { set: "scopes.root.restock", expr: "listProducts({ stockAtMost: 49, limit: 200 })" },
      { set: "scopes.root.suppliers", expr: "listSuppliers()" },
      { set: "scopes.root.catalog", expr: "listProducts({ limit: 200 })" },
      { set: "scopes.root.busy", literal: true },
      { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" },
      { set: "scopes.root.busy", literal: false },
    ],
    children: ["header", "stats", "charts", "toolbar", "table-card", "pager", "rcv-drawer"],
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
    component: "Typography",
    props: { literal: { text: "Live stock levels, supplier lead times, and receiving.", variant: "muted" } },
  },
  {
    key: "rcv-btn",
    component: "Button",
    props: { literal: { text: "Receive stock" } },
    callbacks: { onClick: [{ set: "scopes.root.rcvOpen", literal: true }] },
  },
  { key: "stats", component: "Grid", props: { literal: { columns: "4", gap: "4" } }, children: ["s-count", "s-low", "s-value", "s-restock"] },
  { key: "s-count", component: "Stat", props: { expr: "({ label: 'Products', value: scopes.root.summary.products, helpText: 'in catalog' })" } },
  {
    key: "s-low",
    component: "Stat",
    props: { expr: "({ label: 'Low stock', value: scopes.root.summary.lowStock, trend: scopes.root.summary.lowStock > 0 ? 'down' : 'neutral', helpText: '20 units or fewer' })" },
  },
  {
    key: "s-value",
    component: "Stat",
    props: { expr: "({ label: 'Stock value', value: '$' + Math.round(scopes.root.summary.value).toLocaleString(), helpText: 'at list price' })" },
  },
  {
    key: "s-restock",
    component: "Stat",
    props: {
      expr: "({ label: 'Restock to 50', value: '$' + Math.round(scopes.root.restock.items.reduce((s, p) => s + (50 - p.stock) * p.price, 0)).toLocaleString(), helpText: 'to bring every item to 50 units' })",
    },
  },
  { key: "charts", component: "Grid", props: { literal: { columns: "2", gap: "4" } }, children: ["chart-stock", "chart-share"] },
  { key: "chart-stock", component: "Card", props: { literal: { title: "Units by category" } }, children: ["bar"] },
  {
    key: "bar",
    component: "BarChart",
    props: { expr: "({ data: scopes.root.summary.byCategory.map(c => ({ name: c.category, value: c.units })), xKey: 'name', yKeys: ['value'], height: 240 })" },
  },
  { key: "chart-share", component: "Card", props: { literal: { title: "Value share by category" } }, children: ["donut"] },
  {
    key: "donut",
    component: "PieChart",
    props: {
      expr: "({ data: scopes.root.summary.byCategory.map(c => ({ name: c.category, value: Math.round(c.value) })), height: 240, donut: true, showLabels: false, centerLabel: '$' + Math.round(scopes.root.summary.value / 1000) + 'k' })",
    },
  },
  { key: "toolbar", component: "FlexRow", props: { literal: { gap: "2", align: "center", wrap: true } }, children: ["search", "cat-filter", "sort-key", "sort-dir", "low-switch"] },
  {
    key: "search",
    component: "SearchInput",
    props: { expr: "({ value: scopes.root.q, placeholder: 'Search products or SKU…' })" },
    callbacks: {
      onChange: [{ set: "scopes.root.q", expr: "evt.value" }, { set: "scopes.root.page", literal: 1, debounce: true }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }],
      onSubmit: [{ set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }],
      onClear: [{ set: "scopes.root.q", literal: "" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }],
    },
  },
  {
    key: "cat-filter",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.cat, options: [{ label: 'All categories', value: 'all' }, ...scopes.root.summary.byCategory.map(c => ({ label: c.category, value: c.category }))] })",
    },
    callbacks: { onChange: [{ set: "scopes.root.cat", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "sort-key",
    component: "Select",
    props: { expr: "({ value: scopes.root.sortKey, options: [{ label: 'Sort by name', value: 'name' }, { label: 'Sort by stock', value: 'stock' }, { label: 'Sort by price', value: 'price' }] })" },
    callbacks: { onChange: [{ set: "scopes.root.sortKey", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "sort-dir",
    component: "Button",
    props: { expr: "({ text: scopes.root.sortDesc ? 'Descending' : 'Ascending', variant: 'outline', size: 'sm' })" },
    callbacks: { onClick: [{ set: "scopes.root.sortDesc", expr: "!currentValue" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "low-switch",
    component: "Switch",
    props: { expr: "({ checked: scopes.root.lowOnly, label: 'Low stock only' })" },
    callbacks: { onChange: [{ set: "scopes.root.lowOnly", expr: "evt.checked" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  { key: "table-card", component: "Card", props: { literal: { title: "Products" } }, children: ["table"] },
  { key: "table", component: "Table", loading: "scopes.root.busy", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["hrow"] },
  { key: "hrow", component: "TableRow", children: ["h-name", "h-sku", "h-sup", "h-stock", "h-price", "h-adjust", "h-details"] },
  { key: "h-name", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "h-sku", component: "TableHead", props: { literal: { text: "SKU" } } },
  { key: "h-sup", component: "TableHead", props: { literal: { text: "Supplier (lead time)" } } },
  { key: "h-stock", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "h-price", component: "TableHead", props: { literal: { text: "Price" } } },
  { key: "h-adjust", component: "TableHead", props: { literal: { text: "Adjust" } } },
  { key: "h-details", component: "TableHead", props: { literal: { text: "Ledger" } } },
  { key: "tbody", component: "TableBody", children: ["row"] },
  {
    key: "row",
    component: "TableRow",
    each: "scopes.root.products.items",
    as: "prod",
    keyBy: "id",
    children: ["c-name", "c-sku", "c-sup", "c-stock", "c-price", "c-adjust", "c-details"],
  },
  { key: "c-name", component: "TableCell", props: { expr: "({ text: scopes.prod.name })" } },
  { key: "c-sku", component: "TableCell", props: { expr: "({ text: scopes.prod.sku })" } },
  {
    key: "c-sup",
    component: "TableCell",
    props: {
      expr: "({ text: (scopes.root.suppliers.items.find(s => s.id === scopes.prod.supplierId)?.name ?? '—') + ' (' + (scopes.root.suppliers.items.find(s => s.id === scopes.prod.supplierId)?.leadTimeDays ?? '?') + 'd)' })",
    },
  },
  { key: "c-stock", component: "TableCell", children: ["stock-badge"] },
  {
    key: "stock-badge",
    component: "Badge",
    props: {
      expr: "({ text: scopes.prod.stock, variant: scopes.prod.stock <= 10 ? 'destructive' : scopes.prod.stock <= 20 ? 'outline' : 'secondary' })",
    },
  },
  { key: "c-price", component: "TableCell", props: { expr: "({ text: '$' + scopes.prod.price.toFixed(2) })" } },
  { key: "c-adjust", component: "TableCell", children: ["adjust-row"] },
  { key: "adjust-row", component: "FlexRow", props: { literal: { gap: "1", align: "center" } }, children: ["adjust-minus", "adjust-plus"] },
  {
    key: "adjust-minus",
    component: "Button",
    props: { literal: { icon: "Minus", variant: "ghost", size: "sm", tooltip: "Remove one unit" } },
    callbacks: {
      onClick: [
        { expr: "createStockMovement({ productId: scopes.prod.id, qty: -1, reason: 'adjustment', note: 'Count correction' })" },
        { set: "scopes.prod.stock", expr: "currentValue - 1" },
        { set: "scopes.root.summary", expr: "getStockSummary()" },
      ],
    },
  },
  {
    key: "adjust-plus",
    component: "Button",
    props: { literal: { icon: "Plus", variant: "ghost", size: "sm", tooltip: "Receive one unit" } },
    callbacks: {
      onClick: [
        { expr: "createStockMovement({ productId: scopes.prod.id, qty: 1, reason: 'received', note: 'Single unit' })" },
        { set: "scopes.prod.stock", expr: "currentValue + 1" },
        { set: "scopes.root.summary", expr: "getStockSummary()" },
      ],
    },
  },
  { key: "c-details", component: "TableCell", children: ["details-toggle", "details"] },
  {
    key: "details-toggle",
    component: "Button",
    props: { expr: "({ icon: scopes.root.openId === scopes.$prod.id ? 'ChevronUp' : 'ChevronDown', variant: 'ghost', size: 'sm', tooltip: 'Recent movements' })" },
    callbacks: {
      onClick: [
        { set: "scopes.root.openId", expr: "currentValue === scopes.$prod.id ? null : scopes.$prod.id" },
        { set: "scopes.root.moves", expr: "listStockMovements({ productId: scopes.prod.id, limit: 5 })" },
      ],
    },
  },
  {
    key: "details",
    component: "FlexCol",
    props: { literal: { gap: "0" } },
    hidden: "scopes.root.openId !== scopes.$prod.id",
    children: ["pmov"],
  },
  {
    key: "pmov",
    component: "Typography",
    each: "scopes.root.moves.items",
    as: "pmov",
    keyBy: "id",
    props: { literal: { variant: "small", as: "div" } },
    children: ["pmov-date", "pmov-text"],
  },
  { key: "pmov-date", component: "DateTime", props: { expr: "({ value: scopes.pmov.createdAt })" } },
  {
    key: "pmov-text",
    component: "Typography",
    props: { expr: "({ text: ' · ' + (scopes.pmov.qty > 0 ? '+' : '') + scopes.pmov.qty + ' ' + scopes.pmov.reason, variant: 'small' })" },
  },
  {
    key: "pager",
    component: "Pagination",
    props: { expr: "({ currentPage: scopes.root.page, totalPages: Math.max(1, Math.ceil(scopes.root.products.total / 25)) })" },
    hidden: "scopes.root.products.total <= 25",
    callbacks: { onPageChange: [{ set: "scopes.root.page", expr: "evt.page" }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "rcv-drawer",
    component: "Modal",
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
      expr: "({ value: scopes.root.rcvProductId, placeholder: 'Pick a product', options: scopes.root.catalog.items.map(p => ({ label: p.name + ' (' + p.stock + ' in stock)', value: String(p.id) })) })",
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
    props: { expr: "({ text: 'Receive ' + (scopes.root.rcvQty ?? 0) + ' units', disabled: !scopes.root.rcvQty })" },
    callbacks: {
      onClick: [
        { expr: "createStockMovement({ productId: Number(scopes.root.rcvProductId), qty: scopes.root.rcvQty, reason: 'received', note: scopes.root.rcvNote })" },
        { set: "scopes.root.products", expr: "listProducts({ limit: 25, offset: (scopes.root.page - 1) * 25, sort: scopes.root.sortKey, order: scopes.root.sortDesc ? 'desc' : 'asc', q: scopes.root.q || undefined, category: scopes.root.cat === 'all' ? undefined : scopes.root.cat, stockAtMost: scopes.root.lowOnly ? 20 : undefined })" },
        { set: "scopes.root.summary", expr: "getStockSummary()" },
        { set: "scopes.root.restock", expr: "listProducts({ stockAtMost: 49, limit: 200 })" },
        { set: "scopes.root.catalog", expr: "listProducts({ limit: 200 })" },
        { set: "scopes.root.rcvOpen", literal: false },
        { set: "scopes.root.rcvNote", literal: "" },
      ],
    },
  },
];

const salesEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.status", literal: "all" },
      { set: "scopes.root.days", literal: "all" },
      { set: "scopes.root.customerId", literal: "all" },
      { set: "scopes.root.sortKey", literal: "newest" },
      { set: "scopes.root.page", literal: 1 },
      { set: "scopes.root.busy", literal: false },
      { set: "scopes.root.selected", literal: {} },
      { set: "scopes.root.expanded", literal: {} },
      { set: "scopes.root.now", expr: "now()" },
      { set: "scopes.root.month", expr: "getSalesSummary({ days: 30 })" },
      { set: "scopes.root.week", expr: "getSalesSummary({ days: 7 })" },
      { set: "scopes.root.top", expr: "listCustomers({ sort: 'lifetime', order: 'desc', limit: 8 })" },
      { set: "scopes.root.customers", expr: "listCustomers({ limit: 200 })" },
      { set: "scopes.root.busy", literal: true },
      { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" },
      { set: "scopes.root.busy", literal: false },
    ],
    children: ["title", "subtitle", "stats", "charts-row", "filters", "table-card", "pager"],
  },
  { key: "title", component: "Heading", props: { literal: { level: "1", text: "Sales & revenue" } } },
  {
    key: "subtitle",
    component: "Typography",
    props: { literal: { text: "Where the money is, and which orders still need a push.", variant: "muted" } },
  },
  { key: "stats", component: "Grid", props: { literal: { columns: "5", gap: "4" } }, children: ["s-rev", "s-aov", "s-week", "s-pending", "s-selected"] },
  {
    key: "s-rev",
    component: "Stat",
    props: { expr: "({ label: 'Revenue', value: '$' + Math.round(scopes.root.month.revenue).toLocaleString(), helpText: 'last 30 days, excluding cancelled' })" },
  },
  {
    key: "s-aov",
    component: "Stat",
    props: { expr: "({ label: 'Avg order', value: '$' + Math.round(scopes.root.month.avgOrder).toLocaleString(), helpText: 'last 30 days' })" },
  },
  {
    key: "s-week",
    component: "Stat",
    props: { expr: "({ label: 'Last 7 days', value: '$' + Math.round(scopes.root.week.revenue).toLocaleString(), trend: 'up', helpText: scopes.root.week.count + ' orders' })" },
  },
  {
    key: "s-pending",
    component: "Stat",
    props: {
      expr: "({ label: 'Pending', value: scopes.root.month.byStatus.find(s => s.status === 'pending')?.count ?? 0, trend: (scopes.root.month.byStatus.find(s => s.status === 'pending')?.count ?? 0) > 2 ? 'down' : 'neutral', helpText: 'awaiting payment' })",
    },
  },
  {
    key: "s-selected",
    component: "Stat",
    props: {
      expr: "({ label: 'Selected', value: Object.values(scopes.root.selected).filter(v => v).length, helpText: '$' + Math.round(scopes.root.orders.items.filter(o => scopes.root.selected[o.id]).reduce((s, o) => s + o.total, 0)).toLocaleString() + ' on this page' })",
    },
  },
  { key: "charts-row", component: "Grid", props: { literal: { columns: "2", gap: "4" } }, children: ["trend-card", "top-card"] },
  { key: "trend-card", component: "Card", props: { literal: { title: "Revenue by day", description: "Last 30 days" } }, children: ["trend"] },
  { key: "trend", component: "LineChart", props: { expr: "({ data: scopes.root.month.byDay, xKey: 'date', yKeys: ['revenue'], filled: true, height: 220 })" } },
  { key: "top-card", component: "Card", props: { literal: { title: "Top accounts", description: "Lifetime value, cancelled orders excluded" } }, children: ["top-bar"] },
  {
    key: "top-bar",
    component: "BarChart",
    props: { expr: "({ data: scopes.root.top.items.map(c => ({ name: c.company, lifetime: Math.round(c.lifetime) })), xKey: 'name', yKeys: ['lifetime'], height: 220 })" },
  },
  { key: "filters", component: "FlexRow", props: { literal: { gap: "3", align: "center", wrap: true } }, children: ["filter", "days", "customer-filter", "sort"] },
  {
    key: "filter",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.status, options: [{ label: 'All statuses', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Paid', value: 'paid' }, { label: 'Shipped', value: 'shipped' }, { label: 'Delivered', value: 'delivered' }, { label: 'Cancelled', value: 'cancelled' }] })",
    },
    callbacks: { onChange: [{ set: "scopes.root.status", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "days",
    component: "Radio",
    props: { expr: "({ value: scopes.root.days, orientation: 'horizontal', options: [{ label: '7 days', value: '7' }, { label: '30 days', value: '30' }, { label: '90 days', value: '90' }, { label: 'All time', value: 'all' }] })" },
    callbacks: { onChange: [{ set: "scopes.root.days", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "customer-filter",
    component: "Select",
    props: {
      expr: "({ searchable: true, value: scopes.root.customerId, placeholder: 'Any customer', searchPlaceholder: 'Find a customer…', options: [{ label: 'Any customer', value: 'all' }, ...scopes.root.customers.items.map(c => ({ label: c.name + ' — ' + c.company, value: String(c.id) }))] })",
    },
    callbacks: { onChange: [{ set: "scopes.root.customerId", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "sort",
    component: "Select",
    props: { expr: "({ value: scopes.root.sortKey, options: [{ label: 'Newest first', value: 'newest' }, { label: 'Oldest first', value: 'oldest' }, { label: 'Largest first', value: 'total' }] })" },
    callbacks: { onChange: [{ set: "scopes.root.sortKey", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" }, { set: "scopes.root.busy", literal: false }] },
  },
  { key: "table-card", component: "Card", props: { literal: { title: "Orders" } }, children: ["table"] },
  { key: "table", component: "Table", loading: "scopes.root.busy", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["hrow"] },
  { key: "hrow", component: "TableRow", children: ["h-sel", "h-id", "h-date", "h-cust", "h-prod", "h-total", "h-status", "h-act", "h-cancel", "h-more"] },
  { key: "h-sel", component: "TableHead", props: { literal: { text: "" } } },
  { key: "h-id", component: "TableHead", props: { literal: { text: "#" } } },
  { key: "h-date", component: "TableHead", props: { literal: { text: "Date" } } },
  { key: "h-cust", component: "TableHead", props: { literal: { text: "Customer" } } },
  { key: "h-prod", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "h-total", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "h-status", component: "TableHead", props: { literal: { text: "Status" } } },
  { key: "h-act", component: "TableHead", props: { literal: { text: "" } } },
  { key: "h-cancel", component: "TableHead", props: { literal: { text: "" } } },
  { key: "h-more", component: "TableHead", props: { literal: { text: "" } } },
  { key: "tbody", component: "TableBody", children: ["row"] },
  {
    key: "row",
    component: "TableRow",
    each: "scopes.root.orders.items",
    as: "ord",
    keyBy: "id",
    children: ["c-sel", "c-id", "c-date", "c-cust", "c-prod", "c-total", "c-status", "c-act", "c-cancel", "c-more"],
  },
  { key: "c-sel", component: "TableCell", children: ["sel-check"] },
  {
    key: "sel-check",
    component: "Checkbox",
    props: { expr: "({ checked: scopes.root.selected[scopes.$ord.id] ?? false })" },
    callbacks: { onChange: [{ set: "scopes.root.selected", expr: "({ ...currentValue, [scopes.$ord.id]: evt.checked })" }] },
  },
  { key: "c-id", component: "TableCell", props: { expr: "({ text: String(scopes.ord.id) })" } },
  { key: "c-date", component: "TableCell", children: ["c-date-value"] },
  { key: "c-date-value", component: "DateTime", props: { expr: "({ value: scopes.ord.createdAt })" } },
  { key: "c-cust", component: "TableCell", props: { expr: "({ text: scopes.ord.customerName })" } },
  { key: "c-prod", component: "TableCell", props: { expr: "({ text: scopes.ord.qty + '× ' + scopes.ord.productName })" } },
  { key: "c-total", component: "TableCell", props: { expr: "({ text: '$' + scopes.ord.total.toFixed(2) })" } },
  { key: "c-status", component: "TableCell", children: ["badge"] },
  {
    key: "badge",
    component: "Badge",
    props: {
      expr: "({ text: scopes.ord.status, variant: scopes.ord.status === 'cancelled' ? 'destructive' : scopes.ord.status === 'pending' ? 'outline' : 'secondary' })",
    },
  },
  { key: "c-act", component: "TableCell", children: ["advance"] },
  {
    key: "advance",
    component: "Button",
    props: {
      expr: "({ text: scopes.ord.status === 'pending' ? 'Mark paid' : scopes.ord.status === 'paid' ? 'Mark shipped' : 'Mark delivered', variant: 'outline', size: 'sm' })",
    },
    hidden: "scopes.ord.status === 'delivered' || scopes.ord.status === 'cancelled'",
    callbacks: {
      onClick: [
        { expr: "updateOrder({ id: scopes.ord.id, status: scopes.ord.status === 'pending' ? 'paid' : scopes.ord.status === 'paid' ? 'shipped' : 'delivered' })" },
        { set: "scopes.root.busy", literal: true },
        { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" },
        { set: "scopes.root.month", expr: "getSalesSummary({ days: 30 })" },
        { set: "scopes.root.busy", literal: false },
      ],
    },
  },
  {
    key: "cancel",
    component: "Button",
    props: { literal: { icon: "X", variant: "ghost", size: "sm", tooltip: "Cancel order" } },
    hidden: "scopes.ord.status === 'delivered' || scopes.ord.status === 'cancelled'",
    callbacks: {
      onClick: [
        { expr: "updateOrder({ id: scopes.ord.id, status: 'cancelled' })", confirm: "Cancel this order? The customer will not be charged." },
        { set: "scopes.root.busy", literal: true },
        { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" },
        { set: "scopes.root.month", expr: "getSalesSummary({ days: 30 })" },
        { set: "scopes.root.week", expr: "getSalesSummary({ days: 7 })" },
        { set: "scopes.root.busy", literal: false },
      ],
    },
  },
  { key: "c-cancel", component: "TableCell", children: ["cancel"] },
  { key: "c-more", component: "TableCell", children: ["more-toggle", "more"] },
  {
    key: "more-toggle",
    component: "Button",
    props: { expr: "({ icon: scopes.root.expanded[scopes.$ord.id] ? 'ChevronUp' : 'ChevronDown', variant: 'ghost', size: 'sm', tooltip: 'Details' })" },
    callbacks: { onClick: [{ set: "scopes.root.expanded", expr: "({ ...currentValue, [scopes.$ord.id]: !currentValue[scopes.$ord.id] })" }] },
  },
  {
    key: "more",
    component: "DescriptionList",
    hidden: "!scopes.root.expanded[scopes.$ord.id]",
    props: {
      expr: "({ items: [{ label: 'Company', value: scopes.root.customers.items.find(c => c.id === scopes.ord.customerId)?.company ?? '—' }, { label: 'Email', value: scopes.root.customers.items.find(c => c.id === scopes.ord.customerId)?.email ?? '—' }, { label: 'Unit price', value: '$' + scopes.ord.unitPrice.toFixed(2) }, { label: 'Placed', value: scopes.ord.createdAt.slice(0, 16).replace('T', ' ') }] })",
    },
  },
  {
    key: "pager",
    component: "Pagination",
    props: { expr: "({ currentPage: scopes.root.page, totalPages: Math.max(1, Math.ceil(scopes.root.orders.total / 50)) })" },
    hidden: "scopes.root.orders.total <= 50",
    callbacks: { onPageChange: [{ set: "scopes.root.page", expr: "evt.page" }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.orders", expr: "listOrders({ limit: 50, offset: (scopes.root.page - 1) * 50, sort: scopes.root.sortKey === 'total' ? 'total' : 'createdAt', order: scopes.root.sortKey === 'oldest' ? 'asc' : 'desc', status: scopes.root.status === 'all' ? undefined : scopes.root.status, customerId: scopes.root.customerId === 'all' ? undefined : Number(scopes.root.customerId), days: scopes.root.days === 'all' ? undefined : Number(scopes.root.days) })" }, { set: "scopes.root.busy", literal: false }] },
  },
];

const customersEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.q", literal: "" },
      { set: "scopes.root.sortKey", literal: "name" },
      { set: "scopes.root.page", literal: 1 },
      { set: "scopes.root.busy", literal: false },
      { set: "scopes.root.selectedId", literal: null },
      { set: "scopes.root.history", literal: { items: [], total: 0 } },
      { set: "scopes.root.historyBusy", literal: false },
      { set: "scopes.root.editName", literal: "" },
      { set: "scopes.root.editCompany", literal: "" },
      { set: "scopes.root.editEmail", literal: "" },
      { set: "scopes.root.addOpen", literal: false },
      { set: "scopes.root.newName", literal: "" },
      { set: "scopes.root.newCompany", literal: "" },
      { set: "scopes.root.newEmail", literal: "" },
      { set: "scopes.root.now", expr: "now()" },
      { set: "scopes.root.year", expr: "getSalesSummary({ days: 365 })" },
      { set: "scopes.root.top", expr: "listCustomers({ sort: 'lifetime', order: 'desc', limit: 1 })" },
      { set: "scopes.root.busy", literal: true },
      { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" },
      { set: "scopes.root.busy", literal: false },
    ],
    children: ["header", "stats", "toolbar", "table-card", "pager", "detail", "add-drawer"],
  },
  {
    key: "header",
    component: "FlexRow",
    props: { literal: { justify: "between", align: "center" } },
    children: ["header-text", "add-btn"],
  },
  { key: "header-text", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["title", "subtitle"] },
  { key: "title", component: "Heading", props: { literal: { level: "1", text: "Customer accounts" } } },
  {
    key: "subtitle",
    component: "Typography",
    props: { literal: { text: "Every account, its order history, and lifetime value.", variant: "muted" } },
  },
  {
    key: "add-btn",
    component: "Button",
    props: { literal: { text: "Add customer" } },
    callbacks: { onClick: [{ set: "scopes.root.addOpen", literal: true }] },
  },
  { key: "stats", component: "Grid", props: { literal: { columns: "4", gap: "4" } }, children: ["s-active", "s-rev", "s-top", "s-avg"] },
  { key: "s-active", component: "Stat", props: { expr: "({ label: 'Active accounts', value: scopes.root.year.customers, helpText: 'ordered in the last 12 months' })" } },
  {
    key: "s-rev",
    component: "Stat",
    props: { expr: "({ label: 'Revenue', value: '$' + Math.round(scopes.root.year.revenue).toLocaleString(), helpText: 'last 12 months, excluding cancelled' })" },
  },
  { key: "s-top", component: "Stat", props: { expr: "({ label: 'Top account', value: scopes.root.top.items[0]?.company ?? '—', helpText: 'by lifetime spend' })" } },
  {
    key: "s-avg",
    component: "Stat",
    props: { expr: "({ label: 'Avg per account', value: '$' + Math.round(scopes.root.year.revenue / Math.max(1, scopes.root.year.customers)).toLocaleString(), helpText: 'last 12 months' })" },
  },
  { key: "toolbar", component: "FlexRow", props: { literal: { gap: "3", align: "center", wrap: true } }, children: ["search", "sort"] },
  {
    key: "search",
    component: "SearchInput",
    props: { expr: "({ value: scopes.root.q, placeholder: 'Search by name or company…' })" },
    callbacks: {
      onChange: [{ set: "scopes.root.q", expr: "evt.value" }, { set: "scopes.root.page", literal: 1, debounce: true }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" }, { set: "scopes.root.busy", literal: false }],
      onSubmit: [{ set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" }, { set: "scopes.root.busy", literal: false }],
      onClear: [{ set: "scopes.root.q", literal: "" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" }, { set: "scopes.root.busy", literal: false }],
    },
  },
  {
    key: "sort",
    component: "Select",
    props: { expr: "({ value: scopes.root.sortKey, options: [{ label: 'Sort by name', value: 'name' }, { label: 'Sort by company', value: 'company' }, { label: 'Most orders first', value: 'orders' }, { label: 'Highest lifetime first', value: 'lifetime' }] })" },
    callbacks: { onChange: [{ set: "scopes.root.sortKey", expr: "evt.value" }, { set: "scopes.root.page", literal: 1 }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  { key: "table-card", component: "Card", props: { literal: { title: "Customers" } }, children: ["table"] },
  { key: "table", component: "Table", loading: "scopes.root.busy", children: ["thead", "tbody"] },
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
    each: "scopes.root.customers.items",
    as: "cust",
    keyBy: "id",
    children: ["c-name", "c-comp", "c-email", "c-orders", "c-spend", "c-act"],
  },
  { key: "c-name", component: "TableCell", props: { expr: "({ text: scopes.cust.name })" } },
  { key: "c-comp", component: "TableCell", props: { expr: "({ text: scopes.cust.company })" } },
  { key: "c-email", component: "TableCell", props: { expr: "({ text: scopes.cust.email })" } },
  { key: "c-orders", component: "TableCell", props: { expr: "({ text: String(scopes.cust.orders) })" } },
  { key: "c-spend", component: "TableCell", props: { expr: "({ text: '$' + scopes.cust.lifetime.toFixed(2) })" } },
  { key: "c-act", component: "TableCell", children: ["view-btn"] },
  {
    key: "view-btn",
    component: "Button",
    props: { literal: { text: "View", variant: "ghost", size: "sm" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.selectedId", expr: "scopes.cust.id" },
        { set: "scopes.root.editName", expr: "scopes.cust.name" },
        { set: "scopes.root.editCompany", expr: "scopes.cust.company" },
        { set: "scopes.root.editEmail", expr: "scopes.cust.email" },
        { set: "scopes.root.historyBusy", literal: true },
        { set: "scopes.root.history", expr: "listOrders({ customerId: scopes.cust.id })" },
        { set: "scopes.root.historyBusy", literal: false },
      ],
    },
  },
  {
    key: "pager",
    component: "Pagination",
    props: { expr: "({ currentPage: scopes.root.page, totalPages: Math.max(1, Math.ceil(scopes.root.customers.total / 20)) })" },
    hidden: "scopes.root.customers.total <= 20",
    callbacks: { onPageChange: [{ set: "scopes.root.page", expr: "evt.page" }, { set: "scopes.root.busy", literal: true }, { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" }, { set: "scopes.root.busy", literal: false }] },
  },
  {
    key: "detail",
    component: "Modal",
    props: {
      expr: "({ open: scopes.root.selectedId !== null, title: scopes.root.customers.items.find(c => c.id === scopes.root.selectedId)?.name ?? '', description: scopes.root.customers.items.find(c => c.id === scopes.root.selectedId)?.company ?? '', side: 'right' })",
    },
    callbacks: { onOpenChange: [{ set: "scopes.root.selectedId", expr: "evt.open ? currentValue : null" }] },
    children: ["detail-body"],
  },
  { key: "detail-body", component: "FlexCol", props: { literal: { gap: "4" } }, children: ["d-summary", "d-spark", "d-edit", "d-table"] },
  {
    key: "d-summary",
    component: "DescriptionList",
    props: {
      expr: "({ layout: 'horizontal', columns: '3', items: [{ label: 'Orders', value: String(scopes.root.history.items.length) }, { label: 'Lifetime', value: '$' + scopes.root.history.items.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0).toFixed(2) }, { label: 'Last order', value: scopes.root.history.items[0]?.createdAt.slice(0, 10) ?? '—' }] })",
    },
  },
  {
    key: "d-spark",
    component: "Sparkline",
    props: {
      expr: "({ data: [5, 4, 3, 2, 1, 0].map(k => scopes.root.history.items.filter(o => o.status !== 'cancelled' && Math.floor((scopes.root.now - Date.parse(o.createdAt)) / (30 * 86400000)) === k).reduce((s, o) => s + o.total, 0)), width: 200, height: 32, filled: true })",
    },
  },
  { key: "d-edit", component: "FlexRow", props: { literal: { gap: "2", align: "end", wrap: true } }, children: ["e-name", "e-company", "e-email", "e-save", "e-delete"] },
  {
    key: "e-name",
    component: "Input",
    props: { expr: "({ value: scopes.root.editName, placeholder: 'Name' })" },
    callbacks: { onChange: [{ set: "scopes.root.editName", expr: "evt.value" }] },
  },
  {
    key: "e-company",
    component: "Input",
    props: { expr: "({ value: scopes.root.editCompany, placeholder: 'Company' })" },
    callbacks: { onChange: [{ set: "scopes.root.editCompany", expr: "evt.value" }] },
  },
  {
    key: "e-email",
    component: "Input",
    props: { expr: "({ value: scopes.root.editEmail, placeholder: 'Email', type: 'email' })" },
    callbacks: { onChange: [{ set: "scopes.root.editEmail", expr: "evt.value" }] },
  },
  {
    key: "e-save",
    component: "Button",
    props: { literal: { text: "Save", size: "sm" } },
    callbacks: {
      onClick: [
        { expr: "updateCustomer({ id: scopes.root.selectedId, name: scopes.root.editName, company: scopes.root.editCompany, email: scopes.root.editEmail })" },
        { set: "scopes.root.busy", literal: true },
        { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" },
        { set: "scopes.root.busy", literal: false },
      ],
    },
  },
  {
    key: "e-delete",
    component: "Button",
    props: { literal: { text: "Delete account", variant: "destructive", size: "sm" } },
    callbacks: {
      onClick: [
        { expr: "deleteCustomer({ id: scopes.root.selectedId })", confirm: "Delete this account and its order history?" },
        { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" },
        { set: "scopes.root.selectedId", literal: null },
      ],
    },
  },
  { key: "d-table", component: "Table", loading: "scopes.root.historyBusy", children: ["d-head", "d-body"] },
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
    each: "scopes.root.history.items",
    as: "dord",
    keyBy: "id",
    children: ["dc-date", "dc-prod", "dc-total", "dc-status"],
  },
  { key: "dc-date", component: "TableCell", children: ["dc-date-value"] },
  { key: "dc-date-value", component: "DateTime", props: { expr: "({ value: scopes.dord.createdAt })" } },
  { key: "dc-prod", component: "TableCell", props: { expr: "({ text: scopes.dord.qty + '× ' + scopes.dord.productName })" } },
  { key: "dc-total", component: "TableCell", props: { expr: "({ text: '$' + scopes.dord.total.toFixed(2) })" } },
  { key: "dc-status", component: "TableCell", props: { expr: "({ text: scopes.dord.status })" } },
  {
    key: "add-drawer",
    component: "Modal",
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
        { set: "scopes.root.customers", expr: "listCustomers({ limit: 20, offset: (scopes.root.page - 1) * 20, sort: scopes.root.sortKey, order: scopes.root.sortKey === 'orders' || scopes.root.sortKey === 'lifetime' ? 'desc' : 'asc', q: scopes.root.q || undefined })" },
        { set: "scopes.root.addOpen", literal: false },
        { set: "scopes.root.newName", literal: "" },
        { set: "scopes.root.newCompany", literal: "" },
        { set: "scopes.root.newEmail", literal: "" },
      ],
    },
  },
];

// `seedId` is the page's URL id; `prompt` and `usage` are null for a page written by hand.
export const SEED_PAGES: { seedId: string; title: string; prompt: string | null; entries: ComponentEntry[]; usage: SeedUsage | null }[] = [
  {
    seedId: "seed-page-inventory",
    title: "Inventory & restock",
    usage: run(37500, 4300),
    prompt:
      "I need one place to watch stock. Show me how much we have and what it's worth, which products are running low, and let me find any product fast. I want to fix a count from the table itself, peek at what moved recently, and book a delivery when it arrives.",
    entries: inventoryEntries,
  },
  {
    seedId: "seed-page-sales",
    title: "Sales & revenue",
    usage: run(36800, 3200),
    prompt:
      "Give me a sales page for Monday mornings: how much we made lately, the trend, who our best accounts are, and every order with its status. I should be able to narrow it down by status, period or customer, mark orders as paid or shipped, and cancel one with a warning first.",
    entries: salesEntries,
  },
  {
    seedId: "seed-page-customers",
    title: "Customer accounts",
    usage: run(37300, 3900),
    prompt:
      "A customer page for the account team: who buys from us, how much each has spent, and their order history. Let me look someone up, fix their details, add a new account, and remove one if needed.",
    entries: customersEntries,
  },
  {
    seedId: "seed-page-ops",
    title: "Operations console (big one)",
    usage: run(39600, 15800),
    prompt:
      "Put the whole operation on one page: the numbers at the top, a few charts, our suppliers and what we buy from each, the full catalog where I can adjust stock and prices on the spot, all orders with their status, every customer, and the stock ledger. One search box should work across all of it.",
    entries: opsConsoleEntries,
  },
  {
    seedId: "seed-page-slow",
    title: "Slow seeds",
    usage: null,
    prompt: null,
    entries: slowSeedsEntries,
  },
];

// All fences in a chat share one root scope: a seeded path keeps its first value, so later fences derive from the same data.

const j = (entries: object[]) => entries.map((e) => JSON.stringify(e)).join("\n");

const lowStockFence = j([
  { key: "low-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.low", expr: "listProducts({ stockAtMost: 20, sort: 'stock' })" }, { set: "scopes.root.suppliers", expr: "listSuppliers()" }], children: ["low-stat", "low-table"] },
  { key: "low-stat", component: "Stat", props: { expr: "({ label: 'Products at or below 20 units', value: scopes.root.low.total })" } },
  { key: "low-table", component: "Table", children: ["low-head", "low-body"] },
  { key: "low-head", component: "TableHeader", children: ["low-hrow"] },
  { key: "low-hrow", component: "TableRow", children: ["low-h1", "low-h2", "low-h3", "low-h4"] },
  { key: "low-h1", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "low-h2", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "low-h3", component: "TableHead", props: { literal: { text: "Supplier" } } },
  { key: "low-h4", component: "TableHead", props: { literal: { text: "Lead time" } } },
  { key: "low-body", component: "TableBody", children: ["low-row"] },
  { key: "low-row", component: "TableRow", each: "scopes.root.low.items", as: "lp", keyBy: "id", children: ["low-c1", "low-c2", "low-c3", "low-c4"] },
  { key: "low-c1", component: "TableCell", props: { expr: "({ text: scopes.lp.name })" } },
  { key: "low-c2", component: "TableCell", props: { expr: "({ text: String(scopes.lp.stock) })" } },
  { key: "low-c3", component: "TableCell", props: { expr: "({ text: scopes.root.suppliers.items.find(s => s.id === scopes.lp.supplierId)?.name ?? '—' })" } },
  { key: "low-c4", component: "TableCell", props: { expr: "({ text: (scopes.root.suppliers.items.find(s => s.id === scopes.lp.supplierId)?.leadTimeDays ?? 0) + ' days' })" } },
]);

const restockCostFence = j([
  { key: "cost-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.under60", expr: "listProducts({ stockAtMost: 59, limit: 200 })" }], children: ["cost-total", "cost-table"] },
  { key: "cost-total", component: "Stat", props: { expr: "({ label: 'Total to reach 60 units everywhere', value: '$' + Math.round(scopes.root.under60.items.reduce((s, p) => s + (60 - p.stock) * p.price, 0)).toLocaleString(), helpText: 'at list price — wholesale will be lower' })" } },
  { key: "cost-table", component: "Table", children: ["cost-head", "cost-body"] },
  { key: "cost-head", component: "TableHeader", children: ["cost-hrow"] },
  { key: "cost-hrow", component: "TableRow", children: ["cost-h1", "cost-h2", "cost-h3", "cost-h4"] },
  { key: "cost-h1", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "cost-h2", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "cost-h3", component: "TableHead", props: { literal: { text: "Units needed" } } },
  { key: "cost-h4", component: "TableHead", props: { literal: { text: "Cost" } } },
  { key: "cost-body", component: "TableBody", children: ["cost-row"] },
  { key: "cost-row", component: "TableRow", each: "scopes.root.under60.items.toSorted((a, b) => (60 - b.stock) * b.price - (60 - a.stock) * a.price)", as: "cp", keyBy: "id", children: ["cost-c1", "cost-c2", "cost-c3", "cost-c4"] },
  { key: "cost-c1", component: "TableCell", props: { expr: "({ text: scopes.cp.name })" } },
  { key: "cost-c2", component: "TableCell", props: { expr: "({ text: String(scopes.cp.stock) })" } },
  { key: "cost-c3", component: "TableCell", props: { expr: "({ text: String(60 - scopes.cp.stock) })" } },
  { key: "cost-c4", component: "TableCell", props: { expr: "({ text: '$' + ((60 - scopes.cp.stock) * scopes.cp.price).toLocaleString() })" } },
]);

const poPlanFence = j([
  { key: "po-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.under60", expr: "listProducts({ stockAtMost: 59, limit: 200 })" }, { set: "scopes.root.suppliers", expr: "listSuppliers()" }], children: ["po-table", "po-note"] },
  { key: "po-table", component: "Table", children: ["po-head", "po-body"] },
  { key: "po-head", component: "TableHeader", children: ["po-hrow"] },
  { key: "po-hrow", component: "TableRow", children: ["po-h1", "po-h2", "po-h3", "po-h4"] },
  { key: "po-h1", component: "TableHead", props: { literal: { text: "Supplier" } } },
  { key: "po-h2", component: "TableHead", props: { literal: { text: "Lead time" } } },
  { key: "po-h3", component: "TableHead", props: { literal: { text: "Units" } } },
  { key: "po-h4", component: "TableHead", props: { literal: { text: "Est. cost" } } },
  { key: "po-body", component: "TableBody", children: ["po-row"] },
  { key: "po-row", component: "TableRow", each: "scopes.root.suppliers.items.filter(s => scopes.root.under60.items.some(p => p.supplierId === s.id)).toSorted((a, b) => b.leadTimeDays - a.leadTimeDays)", as: "sup", keyBy: "id", children: ["po-c1", "po-c2", "po-c3", "po-c4"] },
  { key: "po-c1", component: "TableCell", props: { expr: "({ text: scopes.sup.name })" } },
  { key: "po-c2", component: "TableCell", children: ["po-lead-badge"] },
  { key: "po-lead-badge", component: "Badge", props: { expr: "({ text: scopes.sup.leadTimeDays + ' days', variant: scopes.sup.leadTimeDays >= 14 ? 'destructive' : 'secondary' })" } },
  { key: "po-c3", component: "TableCell", props: { expr: "({ text: String(scopes.root.under60.items.filter(p => p.supplierId === scopes.sup.id).reduce((s, p) => s + (60 - p.stock), 0)) })" } },
  { key: "po-c4", component: "TableCell", props: { expr: "({ text: '$' + Math.round(scopes.root.under60.items.filter(p => p.supplierId === scopes.sup.id).reduce((s, p) => s + (60 - p.stock) * p.price, 0)).toLocaleString() })" } },
  { key: "po-note", component: "Typography", props: { literal: { text: "Sorted by lead time — longest first, so the slowest PO goes out today.", variant: "muted" } } },
]);

const receiveCardFence = j([
  { key: "rcv-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.shelf", expr: "listProducts({ q: 'SKU-SHLF-12', limit: 1 })" }, { set: "scopes.root.shelfQty", literal: 52 }], children: ["rcv-card"] },
  { key: "rcv-card", component: "Card", props: { literal: { title: "Receive: Walnut Bookshelf", description: "Writes a movement into the ledger and bumps the stock count." } }, children: ["rcv-stat", "rcv-row"] },
  { key: "rcv-stat", component: "Stat", props: { expr: "({ label: 'In stock right now', value: scopes.root.shelf.items[0]?.stock ?? 0, helpText: 'updates the moment the delivery is booked' })" } },
  { key: "rcv-row", component: "FlexRow", props: { literal: { gap: "2", align: "end" } }, children: ["rcv-qty-field", "rcv-go"] },
  { key: "rcv-qty-field", component: "Field", children: ["rcv-label", "rcv-qty"] },
  { key: "rcv-label", component: "FieldLabel", props: { literal: { text: "Units received" } } },
  { key: "rcv-qty", component: "NumberInput", props: { expr: "({ value: scopes.root.shelfQty, min: 1, step: 1 })" }, callbacks: { onChange: [{ set: "scopes.root.shelfQty", expr: "evt.value" }] } },
  { key: "rcv-go", component: "Button", props: { expr: "({ text: 'Receive ' + (scopes.root.shelfQty ?? 0) + ' units', disabled: !scopes.root.shelfQty })" }, callbacks: { onClick: [
    { expr: "createStockMovement({ productId: scopes.root.shelf.items[0]?.id ?? 0, qty: scopes.root.shelfQty, reason: 'received', note: 'PO from chat' })" },
    { set: "scopes.root.shelf", expr: "listProducts({ q: 'SKU-SHLF-12', limit: 1 })" },
  ] } },
]);

const supplierMapFence = j([
  { key: "map", component: "LocationMap", seed: [{ set: "scopes.root.suppliers", expr: "listSuppliers()" }], props: { expr: "({ center: { lat: 41, lng: 22 }, zoom: 2, width: 680, height: 300, markers: scopes.root.suppliers.items.filter(s => s.location).map(s => ({ lat: s.location.lat, lng: s.location.lng, label: s.name + ' · ' + s.location.city + ' · ' + s.leadTimeDays + ' days' })) })" } },
]);

const revenueFence = j([
  { key: "rev-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.year", expr: "getSalesSummary({ days: 365 })" }], children: ["rev-stats", "rev-chart"] },
  { key: "rev-stats", component: "Grid", props: { literal: { columns: "3", gap: "4" } }, children: ["rev-total", "rev-aov", "rev-open"] },
  { key: "rev-total", component: "Stat", props: { expr: "({ label: 'Revenue', value: '$' + Math.round(scopes.root.year.revenue).toLocaleString(), helpText: 'last 12 months, excl. cancelled' })" } },
  { key: "rev-aov", component: "Stat", props: { expr: "({ label: 'Avg order', value: '$' + Math.round(scopes.root.year.avgOrder).toLocaleString() })" } },
  { key: "rev-open", component: "Stat", props: { expr: "({ label: 'Open orders', value: scopes.root.year.byStatus.filter(s => s.status === 'pending' || s.status === 'paid').reduce((n, s) => n + s.count, 0), helpText: 'pending + paid' })" } },
  { key: "rev-chart", component: "BarChart", props: { expr: "({ data: scopes.root.year.byStatus.map(s => ({ name: s.status, value: s.count })), xKey: 'name', yKeys: ['value'], height: 200 })" } },
]);

const topCustomersFence = j([
  { key: "top-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.top", expr: "listCustomers({ sort: 'lifetime', order: 'desc', limit: 3 })" }], children: ["top-table"] },
  { key: "top-table", component: "Table", children: ["top-head", "top-body"] },
  { key: "top-head", component: "TableHeader", children: ["top-hrow"] },
  { key: "top-hrow", component: "TableRow", children: ["top-h1", "top-h2", "top-h3", "top-h4"] },
  { key: "top-h1", component: "TableHead", props: { literal: { text: "#" } } },
  { key: "top-h2", component: "TableHead", props: { literal: { text: "Account" } } },
  { key: "top-h3", component: "TableHead", props: { literal: { text: "Orders" } } },
  { key: "top-h4", component: "TableHead", props: { literal: { text: "Lifetime" } } },
  { key: "top-body", component: "TableBody", children: ["top-row"] },
  { key: "top-row", component: "TableRow", each: "scopes.root.top.items", as: "tc", keyBy: "id", children: ["top-c1", "top-c2", "top-c3", "top-c4"] },
  { key: "top-c1", component: "TableCell", props: { expr: "({ text: String(scopes.$tc.index + 1) })" } },
  { key: "top-c2", component: "TableCell", props: { expr: "({ text: scopes.tc.name + ' — ' + scopes.tc.company })" } },
  { key: "top-c3", component: "TableCell", props: { expr: "({ text: String(scopes.tc.orders) })" } },
  { key: "top-c4", component: "TableCell", props: { expr: "({ text: '$' + scopes.tc.lifetime.toFixed(2) })" } },
]);

const agingFence = j([
  { key: "age-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [{ set: "scopes.root.pending", expr: "listOrders({ status: 'pending', sort: 'createdAt', order: 'asc' })" }, { set: "scopes.root.now", expr: "now()" }], children: ["age-table"] },
  { key: "age-table", component: "Table", children: ["age-head", "age-body"] },
  { key: "age-head", component: "TableHeader", children: ["age-hrow"] },
  { key: "age-hrow", component: "TableRow", children: ["age-h1", "age-h2", "age-h3", "age-h4", "age-h5"] },
  { key: "age-h1", component: "TableHead", props: { literal: { text: "Order" } } },
  { key: "age-h2", component: "TableHead", props: { literal: { text: "Customer" } } },
  { key: "age-h3", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "age-h4", component: "TableHead", props: { literal: { text: "Waiting" } } },
  { key: "age-h5", component: "TableHead", props: { literal: { text: "" } } },
  { key: "age-body", component: "TableBody", children: ["age-row"] },
  { key: "age-row", component: "TableRow", each: "scopes.root.pending.items", as: "po", keyBy: "id", children: ["age-c1", "age-c2", "age-c3", "age-c4", "age-c5"] },
  { key: "age-c1", component: "TableCell", props: { expr: "({ text: '#' + scopes.po.id + ' · ' + scopes.po.productName })" } },
  { key: "age-c2", component: "TableCell", props: { expr: "({ text: scopes.po.customerName })" } },
  { key: "age-c3", component: "TableCell", props: { expr: "({ text: '$' + scopes.po.total.toFixed(2) })" } },
  { key: "age-c4", component: "TableCell", children: ["age-badge"] },
  { key: "age-badge", component: "Badge", props: { expr: "({ text: Math.round((scopes.root.now - Date.parse(scopes.po.createdAt)) / 86400000) + ' days', variant: (scopes.root.now - Date.parse(scopes.po.createdAt)) / 86400000 >= 3 ? 'destructive' : 'secondary' })" } },
  { key: "age-c5", component: "TableCell", children: ["age-pay"] },
  { key: "age-pay", component: "Button", props: { literal: { text: "Mark paid", variant: "outline", size: "sm" } }, callbacks: { onClick: [
    { expr: "updateOrder({ id: scopes.po.id, status: 'paid' })" },
    { set: "scopes.root.pending", expr: "listOrders({ status: 'pending', sort: 'createdAt', order: 'asc' })" },
  ] } },
]);

const addProductFence = j([
  { key: "ap-root", component: "FlexCol", props: { literal: { gap: "4" } }, seed: [
    { set: "scopes.root.stock", expr: "getStockSummary()" },
    { set: "scopes.root.latest", expr: "listProducts({ sort: 'id', order: 'desc', limit: 3 })" },
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
  { key: "ap-stat", component: "Stat", props: { expr: "({ label: 'Products', value: scopes.root.stock.products })" } },
  { key: "ap-open", component: "Button", props: { literal: { text: "Add product" } }, callbacks: { onClick: [{ set: "scopes.root.npOpen", literal: true }] } },
  { key: "ap-latest", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["ap-line"] },
  { key: "ap-line", component: "Typography", each: "scopes.root.latest.items", as: "np", keyBy: "id", props: { expr: "({ text: scopes.np.name + ' — ' + scopes.np.sku + ' — $' + scopes.np.price.toFixed(2), variant: 'muted' })" } },
  { key: "ap-drawer", component: "Modal", props: { expr: "({ open: scopes.root.npOpen, title: 'New product', description: 'Saved through the same API the rest of the app uses.', side: 'right' })" }, callbacks: { onOpenChange: [{ set: "scopes.root.npOpen", expr: "evt.open" }] }, children: ["ap-form"] },
  { key: "ap-form", component: "FlexCol", props: { literal: { gap: "4" } }, children: ["apf-name", "apf-sku", "apf-cat", "apf-sup", "apf-stock", "apf-price", "ap-actions"] },
  { key: "apf-name", component: "Field", children: ["apl-name", "api-name"] },
  { key: "apl-name", component: "FieldLabel", props: { literal: { text: "Name" } } },
  { key: "api-name", component: "Input", props: { expr: "({ value: scopes.root.npName, placeholder: 'Oak Monitor Riser' })" }, callbacks: { onChange: [{ set: "scopes.root.npName", expr: "evt.value" }] } },
  { key: "apf-sku", component: "Field", children: ["apl-sku", "api-sku"] },
  { key: "apl-sku", component: "FieldLabel", props: { literal: { text: "SKU" } } },
  { key: "api-sku", component: "Input", props: { expr: "({ value: scopes.root.npSku, placeholder: 'SKU-RISE-13' })" }, callbacks: { onChange: [{ set: "scopes.root.npSku", expr: "evt.value" }] } },
  { key: "apf-cat", component: "Field", children: ["apl-cat", "api-cat"] },
  { key: "apl-cat", component: "FieldLabel", props: { literal: { text: "Category" } } },
  { key: "api-cat", component: "Select", props: { expr: "({ value: scopes.root.npCategory, options: scopes.root.stock.byCategory.map(c => ({ label: c.category, value: c.category })) })" }, callbacks: { onChange: [{ set: "scopes.root.npCategory", expr: "evt.value" }] } },
  { key: "apf-sup", component: "Field", children: ["apl-sup", "api-sup"] },
  { key: "apl-sup", component: "FieldLabel", props: { literal: { text: "Supplier" } } },
  { key: "api-sup", component: "Select", props: { expr: "({ value: scopes.root.npSupplierId, placeholder: 'Pick a supplier', options: scopes.root.suppliers.items.map(s => ({ label: s.name + ' (' + s.leadTimeDays + 'd)', value: String(s.id) })) })" }, callbacks: { onChange: [{ set: "scopes.root.npSupplierId", expr: "evt.value" }] } },
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
    { set: "scopes.root.latest", expr: "listProducts({ sort: 'id', order: 'desc', limit: 3 })" },
    { set: "scopes.root.stock", expr: "getStockSummary()" },
    { set: "scopes.root.npOpen", literal: false },
    { set: "scopes.root.npName", literal: "" },
    { set: "scopes.root.npSku", literal: "" },
  ] } },
]);

const quickRestockFence = j([
  { key: "qr-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.low25", expr: "listProducts({ stockAtMost: 25, sort: 'stock' })" }], children: ["qr-table"] },
  { key: "qr-table", component: "Table", children: ["qr-head", "qr-body"] },
  { key: "qr-head", component: "TableHeader", children: ["qr-hrow"] },
  { key: "qr-hrow", component: "TableRow", children: ["qr-h1", "qr-h2", "qr-h3"] },
  { key: "qr-h1", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "qr-h2", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "qr-h3", component: "TableHead", props: { literal: { text: "" } } },
  { key: "qr-body", component: "TableBody", children: ["qr-row"] },
  { key: "qr-row", component: "TableRow", each: "scopes.root.low25.items", as: "qp", keyBy: "id", children: ["qr-c1", "qr-c2", "qr-c3"] },
  { key: "qr-c1", component: "TableCell", props: { expr: "({ text: scopes.qp.name })" } },
  { key: "qr-c2", component: "TableCell", children: ["qr-badge"] },
  { key: "qr-badge", component: "Badge", props: { expr: "({ text: scopes.qp.stock, variant: scopes.qp.stock <= 10 ? 'destructive' : 'outline' })" } },
  { key: "qr-c3", component: "TableCell", children: ["qr-btn"] },
  { key: "qr-btn", component: "Button", props: { literal: { text: "Receive 25", variant: "outline", size: "sm" } }, callbacks: { onClick: [
    { expr: "createStockMovement({ productId: scopes.qp.id, qty: 25, reason: 'received', note: 'Quick restock from chat' })" },
    { set: "scopes.root.low25", expr: "listProducts({ stockAtMost: 25, sort: 'stock' })" },
  ] } },
]);

const guardedCancelFence = j([
  { key: "gc-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.pending", expr: "listOrders({ status: 'pending' })" }], children: ["gc-table"] },
  { key: "gc-table", component: "Table", children: ["gc-head", "gc-body"] },
  { key: "gc-head", component: "TableHeader", children: ["gc-hrow"] },
  { key: "gc-hrow", component: "TableRow", children: ["gc-h1", "gc-h2", "gc-h3", "gc-h4"] },
  { key: "gc-h1", component: "TableHead", props: { literal: { text: "Order" } } },
  { key: "gc-h2", component: "TableHead", props: { literal: { text: "Customer" } } },
  { key: "gc-h3", component: "TableHead", props: { literal: { text: "Total" } } },
  { key: "gc-h4", component: "TableHead", props: { literal: { text: "" } } },
  { key: "gc-body", component: "TableBody", children: ["gc-row"] },
  { key: "gc-row", component: "TableRow", each: "scopes.root.pending.items", as: "go", keyBy: "id", children: ["gc-c1", "gc-c2", "gc-c3", "gc-c4"] },
  { key: "gc-c1", component: "TableCell", props: { expr: "({ text: '#' + scopes.go.id + ' · ' + scopes.go.qty + '× ' + scopes.go.productName })" } },
  { key: "gc-c2", component: "TableCell", props: { expr: "({ text: scopes.go.customerName })" } },
  { key: "gc-c3", component: "TableCell", props: { expr: "({ text: '$' + scopes.go.total.toFixed(2) })" } },
  { key: "gc-c4", component: "TableCell", children: ["gc-btn"] },
  { key: "gc-btn", component: "Button", props: { literal: { text: "Cancel order", variant: "destructive", size: "sm" } }, callbacks: { onClick: [
    { expr: "updateOrder({ id: scopes.go.id, status: 'cancelled' })", confirm: "Cancel this order? The customer will not be charged, and the row moves out of the pending queue." },
    { set: "scopes.root.pending", expr: "listOrders({ status: 'pending' })" },
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
        usage: run(36300, 620),
        text: `Three products are at or below 20 units:\n\n\`\`\`uicast\n${lowStockFence}\n\`\`\`\n\nThe one to worry about is the **Birch Standing Desk** — Nordform Werk runs a 21-day lead time, so an order placed today lands right at the start of the push. The other two have a week or less of lead.`,
      },
      {
        role: "user",
        text: "What would it cost to bring everything that's under 60 units back up to 60?",
      },
      {
        role: "assistant",
        usage: run(37900, 540, 36300),
        text: `Here's the bill, biggest line first:\n\n\`\`\`uicast\n${restockCostFence}\n\`\`\`\n\nTwo caveats: these are list prices, so the real POs should come in 30–45% lower at wholesale — and the desk line dominates because of its unit price, not its unit count.`,
      },
      {
        role: "user",
        text: "Fine, assume we do all of it. Draft the receiving plan by supplier so I can send the POs.",
      },
      {
        role: "assistant",
        usage: run(39600, 580, 37900),
        text: `Grouped by supplier, slowest lead first:\n\n\`\`\`uicast\n${poPlanFence}\n\`\`\`\n\nSend **Nordform Werk today** — nothing else is time-critical. Once the goods arrive, log them with the *Receive stock* drawer on the Inventory page so the ledger stays reconciled.`,
      },
      {
        role: "user",
        text: "The bookshelf delivery just arrived early, actually — 52 boxes on the dock. Book it in for me.",
      },
      {
        role: "assistant",
        usage: run(41100, 410, 39600),
        text: `Here you go — adjust the count if the dock miscounted, then book it:\n\n\`\`\`uicast\n${receiveCardFence}\n\`\`\`\n\nThe stat above is live: it re-reads the product the moment the movement lands, so you'll see the stock jump when you click.`,
      },
      {
        role: "user",
        text: "Where do all our suppliers ship from? The lead times are all over the place.",
      },
      {
        role: "assistant",
        usage: run(42600, 390, 41100),
        text: `Hover a pin for the city and lead time:\n\n\`\`\`uicast\n${supplierMapFence}\n\`\`\`\n\nThe European suppliers mostly ship in 4–12 days and the Asian ones in 16–18. **Nordform Werk** is the exception: Hamburg, but 21 days, so that time goes into building the furniture, not shipping it.`,
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
        usage: run(36100, 480),
        text: `Here's the headline view:\n\n\`\`\`uicast\n${revenueFence}\n\`\`\`\n\nDelivered orders carry most of the volume, and the open pipeline (pending + paid) is healthy. Nothing alarming in the mix.`,
      },
      { role: "user", text: "Who are our top three accounts right now?" },
      {
        role: "assistant",
        usage: run(37500, 510, 36100),
        text: `By lifetime spend, excluding cancellations:\n\n\`\`\`uicast\n${topCustomersFence}\n\`\`\`\n\nWorth noting the top account got there on furniture — high ticket, low frequency. A repeat order there moves the quarter more than five accessory sales.`,
      },
      {
        role: "user",
        text: "Anything stuck? I don't want another aging-pending situation like July.",
      },
      {
        role: "assistant",
        usage: run(39000, 540, 37500),
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
        usage: run(35800, 830),
        text: `It's a working app surface, not a rendering. Try it — the button opens a real form:\n\n\`\`\`uicast\n${addProductFence}\n\`\`\`\n\nThe drawer, the inputs, the supplier dropdown and the save all run against the same API as the rest of the app. Save something and watch the catalog list above pick it up.`,
      },
      {
        role: "user",
        text: "Okay, that's a form. Now give me one-click restock for whatever's running low.",
      },
      {
        role: "assistant",
        usage: run(37600, 560, 35800),
        text: `One click per row — each button books 25 units into the stock ledger and the badge updates in place:\n\n\`\`\`uicast\n${quickRestockFence}\n\`\`\`\n\nRows leave the list on their own once they cross 25 units, because the table re-reads the low-stock filter after every receive.`,
      },
      {
        role: "user",
        text: "Last one: something destructive. I want to see the guardrail.",
      },
      {
        role: "assistant",
        usage: run(39200, 520, 37600),
        text: `Cancelling an order asks first — click one:\n\n\`\`\`uicast\n${guardedCancelFence}\n\`\`\`\n\nThe confirmation is part of the callback itself: decline it and nothing after it runs, accept it and the update lands and the queue re-reads.`,
      },
    ],
  },
];

export async function insertSeedChats(userId: string): Promise<void> {
  for (const chat of SEED_CHATS) {
    const { id } = chat;
    await db.insert(chats).values({ id, userId, title: chat.title });
    await db.insert(chatMessages).values(
      chat.turns.map(({ role, text, usage }, i) => ({
        chatId: id,
        messageId: `${id}-${i}`,
        role,
        parts: [{ type: "text", text }],
        metadata: usage ? { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsd: usage.costUsd } : null,
        model: usage?.model ?? null,
      })),
    );
  }
}

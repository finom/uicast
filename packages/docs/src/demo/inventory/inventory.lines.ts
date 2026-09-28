import type { ComponentEntry } from "@uicast/core";

// Every write re-fetches `products` and `categories` whole, so each element that reads them updates.
export const inventoryLines: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.q", literal: "" },
      { set: "scopes.root.busy", literal: false },
      { set: "scopes.root.draftOpen", literal: false },
      { set: "scopes.root.draftId", literal: null },
      { set: "scopes.root.draftName", literal: "" },
      { set: "scopes.root.draftSku", literal: "" },
      { set: "scopes.root.draftCategory", literal: "" },
      { set: "scopes.root.draftStock", literal: 0 },
      { set: "scopes.root.draftPrice", literal: 0 },
      { set: "scopes.root.products", expr: "listProducts()" },
    ],
    children: ["header", "stats-row", "chart-card", "toolbar", "table-card", "drawer"],
  },

  {
    key: "header",
    component: "FlexRow",
    props: { literal: { justify: "between", align: "center" } },
    children: ["header-text", "new-btn"],
  },
  {
    key: "header-text",
    component: "FlexCol",
    props: { literal: { gap: "1" } },
    children: ["title", "subtitle"],
  },
  {
    key: "title",
    component: "Heading",
    props: { literal: { level: "1", text: "Inventory" } },
  },
  {
    key: "subtitle",
    component: "Typography",
    props: {
      literal: {
        text: "Manage your product catalog — add, edit, and track stock.",
        variant: "muted",
      },
    },
  },
  {
    key: "new-btn",
    component: "Button",
    props: { literal: { text: "New product" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.draftId", literal: null },
        { set: "scopes.root.draftName", literal: "" },
        { set: "scopes.root.draftSku", literal: "" },
        { set: "scopes.root.draftCategory", literal: "" },
        { set: "scopes.root.draftStock", literal: 0 },
        { set: "scopes.root.draftPrice", literal: 0 },
        { set: "scopes.root.draftOpen", literal: true },
      ],
    },
  },

  {
    key: "stats-row",
    component: "Grid",
    props: { literal: { columns: "3", gap: "4" } },
    children: ["stat-skus", "stat-low", "stat-value"],
  },
  {
    key: "stat-skus",
    component: "Stat",
    props: {
      expr: "({ label: 'Total SKUs', value: scopes.root.products.length, helpText: 'products in catalog' })",
    },
  },
  {
    key: "stat-low",
    component: "Stat",
    props: {
      expr: "({ label: 'Low stock', value: scopes.root.products.filter(p => p.stock <= 20).length, trend: scopes.root.products.filter(p => p.stock <= 20).length > 0 ? 'down' : 'neutral', helpText: 'at or below 20 units' })",
    },
  },
  {
    key: "stat-value",
    component: "Stat",
    props: {
      expr: "({ label: 'Inventory value', value: '$' + Math.round(scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0)).toLocaleString(), helpText: 'total stock value' })",
    },
  },

  // An async `seed` of its own: only this card shows its skeleton while the breakdown loads.
  {
    key: "chart-card",
    component: "Card",
    props: { literal: { title: "Stock by category" } },
    seed: [{ set: "scopes.root.categories", expr: "getCategoryBreakdown()" }],
    children: ["chart"],
  },
  {
    key: "chart",
    component: "BarChart",
    loading: "scopes.root.busy",
    props: {
      expr: "({ data: scopes.root.categories, xKey: 'name', yKeys: ['value'], height: 280 })",
    },
  },

  {
    key: "toolbar",
    component: "FlexRow",
    props: { literal: { gap: "2" } },
    children: ["search"],
  },
  {
    key: "search",
    component: "SearchInput",
    props: {
      expr: "({ value: scopes.root.q, placeholder: 'Search products or SKU…' })",
    },
    callbacks: {
      onChange: [{ set: "scopes.root.q", expr: "evt.value" }],
      onClear: [{ set: "scopes.root.q", literal: "" }],
    },
  },

  {
    key: "table-card",
    component: "Card",
    props: { literal: { title: "Products" } },
    children: ["table", "empty"],
  },
  { key: "table", component: "Table", loading: "scopes.root.busy", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["head-row"] },
  {
    key: "head-row",
    component: "TableRow",
    children: ["h-name", "h-sku", "h-cat", "h-stock", "h-price", "h-actions"],
  },
  { key: "h-name", component: "TableHead", props: { literal: { text: "Product" } } },
  { key: "h-sku", component: "TableHead", props: { literal: { text: "SKU" } } },
  { key: "h-cat", component: "TableHead", props: { literal: { text: "Category" } } },
  { key: "h-stock", component: "TableHead", props: { literal: { text: "Stock" } } },
  { key: "h-price", component: "TableHead", props: { literal: { text: "Price" } } },
  { key: "h-actions", component: "TableHead", props: { literal: { text: "" } } },
  { key: "tbody", component: "TableBody", children: ["row-list"] },

  {
    key: "row-list",
    component: "TableRow",
    each: "scopes.root.products.filter(p => !scopes.root.q || p.name.toLowerCase().includes(scopes.root.q.toLowerCase()) || p.sku.toLowerCase().includes(scopes.root.q.toLowerCase()))",
    as: "row",
    keyBy: "id",
    children: ["c-name", "c-sku", "c-cat", "c-stock", "c-price", "c-actions"],
  },
  { key: "c-name", component: "TableCell", props: { expr: "({ text: scopes.row.name })" } },
  { key: "c-sku", component: "TableCell", props: { expr: "({ text: scopes.row.sku })" } },
  { key: "c-cat", component: "TableCell", props: { expr: "({ text: scopes.row.category })" } },
  { key: "c-stock", component: "TableCell", children: ["stock-badge"] },
  {
    key: "stock-badge",
    component: "Badge",
    props: {
      expr: "({ text: '' + scopes.row.stock, variant: scopes.row.stock <= 0 ? 'destructive' : (scopes.row.stock <= 20 ? 'outline' : 'secondary') })",
    },
  },
  { key: "c-price", component: "TableCell", props: { expr: "({ text: '$' + scopes.row.price })" } },
  { key: "c-actions", component: "TableCell", children: ["edit-btn", "del-btn"] },
  {
    key: "edit-btn",
    component: "Button",
    props: { literal: { icon: "Pencil", variant: "ghost", tooltip: "Edit", size: "sm" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.draftId", expr: "scopes.row.id" },
        { set: "scopes.root.draftName", expr: "scopes.row.name" },
        { set: "scopes.root.draftSku", expr: "scopes.row.sku" },
        { set: "scopes.root.draftCategory", expr: "scopes.row.category" },
        { set: "scopes.root.draftStock", expr: "scopes.row.stock" },
        { set: "scopes.root.draftPrice", expr: "scopes.row.price" },
        { set: "scopes.root.draftOpen", literal: true },
      ],
    },
  },
  {
    key: "del-btn",
    component: "Button",
    props: { literal: { icon: "Trash2", tooltip: "Delete", size: "sm", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._op",
          expr: "deleteProduct({ id: scopes.row.id })",
          confirm: "Delete this product? This cannot be undone.",
        },
        { set: "scopes.root.busy", literal: true },
        { set: "scopes.root.products", expr: "listProducts()" },
        { set: "scopes.root.categories", expr: "getCategoryBreakdown()" },
        { set: "scopes.root.busy", literal: false },
      ],
    },
  },
  {
    key: "empty",
    component: "EmptyState",
    props: {
      literal: {
        title: "No products found",
        description: "Try a different search, or add a product.",
      },
    },
    hidden:
      "scopes.root.products.filter(p => !scopes.root.q || p.name.toLowerCase().includes(scopes.root.q.toLowerCase()) || p.sku.toLowerCase().includes(scopes.root.q.toLowerCase())).length > 0",
  },

  {
    key: "drawer",
    component: "Modal",
    props: {
      expr: "({ open: scopes.root.draftOpen, title: scopes.root.draftId ? 'Edit product' : 'New product', side: 'right' })",
    },
    callbacks: {
      onOpenChange: [{ set: "scopes.root.draftOpen", expr: "evt.open" }],
    },
    children: ["form"],
  },
  {
    key: "form",
    component: "FlexCol",
    props: { literal: { gap: "4" } },
    children: ["f-name", "f-sku", "f-cat", "f-stock", "f-price", "form-actions"],
  },
  { key: "f-name", component: "Field", children: ["l-name", "i-name"] },
  { key: "l-name", component: "FieldLabel", props: { literal: { text: "Name" } } },
  {
    key: "i-name",
    component: "Input",
    props: { expr: "({ value: scopes.root.draftName, placeholder: 'Product name' })" },
    callbacks: { onChange: [{ set: "scopes.root.draftName", expr: "evt.value" }] },
  },
  { key: "f-sku", component: "Field", children: ["l-sku", "i-sku"] },
  { key: "l-sku", component: "FieldLabel", props: { literal: { text: "SKU" } } },
  {
    key: "i-sku",
    component: "Input",
    props: { expr: "({ value: scopes.root.draftSku, placeholder: 'SKU-0000' })" },
    callbacks: { onChange: [{ set: "scopes.root.draftSku", expr: "evt.value" }] },
  },
  { key: "f-cat", component: "Field", children: ["l-cat", "i-cat"] },
  { key: "l-cat", component: "FieldLabel", props: { literal: { text: "Category" } } },
  {
    key: "i-cat",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.draftCategory, placeholder: 'Select category', options: (scopes.root.categories || []).map(c => ({ label: c.name, value: c.name })) })",
    },
    callbacks: { onChange: [{ set: "scopes.root.draftCategory", expr: "evt.value" }] },
  },
  { key: "f-stock", component: "Field", children: ["l-stock", "i-stock"] },
  { key: "l-stock", component: "FieldLabel", props: { literal: { text: "Stock" } } },
  {
    key: "i-stock",
    component: "NumberInput",
    props: { expr: "({ value: scopes.root.draftStock, min: 0 })" },
    callbacks: { onChange: [{ set: "scopes.root.draftStock", expr: "evt.value" }] },
  },
  { key: "f-price", component: "Field", children: ["l-price", "i-price"] },
  { key: "l-price", component: "FieldLabel", props: { literal: { text: "Price" } } },
  {
    key: "i-price",
    component: "CurrencyInput",
    props: { expr: "({ value: scopes.root.draftPrice })" },
    callbacks: { onChange: [{ set: "scopes.root.draftPrice", expr: "evt.value" }] },
  },
  {
    key: "form-actions",
    component: "FlexRow",
    props: { literal: { justify: "end", gap: "2" } },
    children: ["cancel-btn", "save-btn"],
  },
  {
    key: "cancel-btn",
    component: "Button",
    props: { literal: { variant: "outline", text: "Cancel" } },
    callbacks: { onClick: [{ set: "scopes.root.draftOpen", literal: false }] },
  },
  {
    key: "save-btn",
    component: "Button",
    props: { literal: { text: "Save product" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._op",
          expr: "scopes.root.draftId ? updateProduct({ id: scopes.root.draftId, name: scopes.root.draftName, sku: scopes.root.draftSku, category: scopes.root.draftCategory, stock: scopes.root.draftStock, price: scopes.root.draftPrice }) : createProduct({ name: scopes.root.draftName, sku: scopes.root.draftSku, category: scopes.root.draftCategory, stock: scopes.root.draftStock, price: scopes.root.draftPrice })",
        },
        { set: "scopes.root.busy", literal: true },
        { set: "scopes.root.products", expr: "listProducts()" },
        { set: "scopes.root.categories", expr: "getCategoryBreakdown()" },
        { set: "scopes.root.busy", literal: false },
        { set: "scopes.root.draftOpen", literal: false },
      ],
    },
  },
];

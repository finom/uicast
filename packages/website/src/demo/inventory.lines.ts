import type { Fired } from "@ui-fired/core/types";

/**
 * The generated artifact — the JSONLines a model would stream to build the
 * inventory app, hand-authored here as a typed `Fired.Element[]`. The demo
 * reveals these one element at a time to simulate streaming, feeding the
 * growing array to the engine's `<Renderer lines={…} />`.
 *
 * Design notes (why it's shaped this way):
 * - Everything reactive derives from ONE source array, `scopes.root.products`,
 *   loaded by the root's async `defaults`. Subscription is path-exact, so the
 *   stats (derived inline), the chart's category data, and the table list all
 *   read whole-array paths that the CRUD callbacks re-write wholesale — which
 *   is what makes the UI stay in sync after add/edit/delete.
 * - List items are read as `scopes.row.item.*`.
 * - `defaults` whose expr returns a Promise suspend that element (Suspense),
 *   showing a placeholder until the data resolves — the async-defaults showcase.
 */
export const inventoryLines: Fired.Element[] = [
  // Root: seeds all UI state + the async product load everything derives from.
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    defaults: [
      { set: "scopes.root.q", literal: "" },
      { set: "scopes.root.draftOpen", literal: false },
      { set: "scopes.root.draftId", literal: null },
      { set: "scopes.root.draftName", literal: "" },
      { set: "scopes.root.draftSku", literal: "" },
      { set: "scopes.root.draftCategory", literal: "" },
      { set: "scopes.root.draftStock", literal: 0 },
      { set: "scopes.root.draftPrice", literal: 0 },
      { set: "scopes.root.products", expr: "await listProducts()" },
    ],
    children: ["header", "statsRow", "chartCard", "toolbar", "tableCard", "drawer"],
  },

  // Header: title block + primary "New product" action.
  {
    key: "header",
    component: "FlexRow",
    props: { literal: { justify: "between", align: "center" } },
    children: ["headerText", "newBtn"],
  },
  {
    key: "headerText",
    component: "FlexCol",
    props: { literal: { gap: "1" } },
    children: ["title", "subtitle"],
  },
  {
    key: "title",
    component: "Heading",
    props: { literal: { level: "1", children: "Inventory" } },
  },
  {
    key: "subtitle",
    component: "Text",
    props: {
      literal: {
        children: "Manage your product catalog — add, edit, and track stock.",
        variant: "muted",
      },
    },
  },
  {
    key: "newBtn",
    component: "Button",
    props: { literal: { children: "New product" } },
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

  // Stats: derived inline from products → re-compute on every CRUD reload.
  {
    key: "statsRow",
    component: "Grid",
    props: { literal: { columns: "3", gap: "4" } },
    children: ["statSkus", "statLow", "statValue"],
  },
  // Count through a method call (`.filter(Boolean).length`), not a bare
  // `scopes.root.products.length`. Dep extraction records a *method* chain as its
  // parent path (`scopes.root.products`) but a plain `.length` access as the
  // deeper path `scopes.root.products.length`. The CRUD callbacks reassign the
  // whole array (`scopes.root.products = await listProducts()`) and subscription
  // is path-exact, so a bare-`.length` reader would never wake. statLow/statValue
  // are reactive for the same reason — they read via `.filter(…)` / `.reduce(…)`.
  {
    key: "statSkus",
    component: "Stat",
    props: {
      expr: "({ label: 'Total SKUs', value: scopes.root.products.filter(Boolean).length, helpText: 'products in catalog' })",
    },
  },
  {
    key: "statLow",
    component: "Stat",
    props: {
      expr: "({ label: 'Low stock', value: scopes.root.products.filter(p => p.stock <= 20).length, trend: scopes.root.products.filter(p => p.stock <= 20).length > 0 ? 'down' : 'neutral', helpText: 'at or below 20 units' })",
    },
  },
  {
    key: "statValue",
    component: "Stat",
    props: {
      expr: "({ label: 'Inventory value', value: '$' + Math.round(scopes.root.products.reduce((s, p) => s + p.price * p.stock, 0)).toLocaleString(), helpText: 'total stock value' })",
    },
  },

  // Chart: its own async default → a localized loading skeleton.
  {
    key: "chartCard",
    component: "Card",
    props: { literal: { title: "Stock by category" } },
    defaults: [{ set: "scopes.root.categories", expr: "await getCategoryBreakdown()" }],
    children: ["chart"],
  },
  {
    key: "chart",
    component: "BarChart",
    props: {
      expr: "({ data: scopes.root.categories, xKey: 'name', yKeys: ['value'], height: 280 })",
    },
  },

  // Toolbar: search filters the table list reactively.
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

  // Products table.
  {
    key: "tableCard",
    component: "Card",
    props: { literal: { title: "Products" } },
    children: ["table", "empty"],
  },
  { key: "table", component: "Table", children: ["thead", "tbody"] },
  { key: "thead", component: "TableHeader", children: ["headRow"] },
  {
    key: "headRow",
    component: "TableRow",
    children: ["hName", "hSku", "hCat", "hStock", "hPrice", "hActions"],
  },
  { key: "hName", component: "TableHead", props: { literal: { children: "Product" } } },
  { key: "hSku", component: "TableHead", props: { literal: { children: "SKU" } } },
  { key: "hCat", component: "TableHead", props: { literal: { children: "Category" } } },
  { key: "hStock", component: "TableHead", props: { literal: { children: "Stock" } } },
  { key: "hPrice", component: "TableHead", props: { literal: { children: "Price" } } },
  { key: "hActions", component: "TableHead", props: { literal: { children: "" } } },
  { key: "tbody", component: "TableBody", children: ["rowList"] },

  // The list: one TableRow per (filtered) product. Item scope is `scopes.row`.
  {
    key: "rowList",
    component: "TableRow",
    each: "scopes.root.products.filter(p => !scopes.root.q || p.name.toLowerCase().includes(scopes.root.q.toLowerCase()) || p.sku.toLowerCase().includes(scopes.root.q.toLowerCase()))",
    as: "row",
    keyBy: "id",
    children: ["cName", "cSku", "cCat", "cStock", "cPrice", "cActions"],
  },
  { key: "cName", component: "TableCell", props: { expr: "({ children: scopes.row.item.name })" } },
  { key: "cSku", component: "TableCell", props: { expr: "({ children: scopes.row.item.sku })" } },
  { key: "cCat", component: "TableCell", props: { expr: "({ children: scopes.row.item.category })" } },
  { key: "cStock", component: "TableCell", children: ["stockBadge"] },
  {
    key: "stockBadge",
    component: "Badge",
    props: {
      expr: "({ children: '' + scopes.row.item.stock, variant: scopes.row.item.stock <= 0 ? 'destructive' : (scopes.row.item.stock <= 20 ? 'outline' : 'secondary') })",
    },
  },
  { key: "cPrice", component: "TableCell", props: { expr: "({ children: '$' + scopes.row.item.price })" } },
  { key: "cActions", component: "TableCell", children: ["editBtn", "delBtn"] },
  {
    key: "editBtn",
    component: "IconButton",
    props: { literal: { icon: "Pencil", tooltip: "Edit", size: "sm" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.draftId", expr: "scopes.row.item.id" },
        { set: "scopes.root.draftName", expr: "scopes.row.item.name" },
        { set: "scopes.root.draftSku", expr: "scopes.row.item.sku" },
        { set: "scopes.root.draftCategory", expr: "scopes.row.item.category" },
        { set: "scopes.root.draftStock", expr: "scopes.row.item.stock" },
        { set: "scopes.root.draftPrice", expr: "scopes.row.item.price" },
        { set: "scopes.root.draftOpen", literal: true },
      ],
    },
  },
  {
    key: "delBtn",
    component: "IconButton",
    props: { literal: { icon: "Trash2", tooltip: "Delete", size: "sm", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._op",
          expr: "await deleteProduct({ id: scopes.row.item.id })",
          confirm: "Delete this product? This cannot be undone.",
        },
        { set: "scopes.root.products", expr: "await listProducts()" },
        { set: "scopes.root.categories", expr: "await getCategoryBreakdown()" },
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

  // Add / edit drawer (a controlled side panel bound to the flat draft* state).
  {
    key: "drawer",
    component: "Drawer",
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
    children: ["fName", "fSku", "fCat", "fStock", "fPrice", "formActions"],
  },
  { key: "fName", component: "Field", children: ["lName", "iName"] },
  { key: "lName", component: "FieldLabel", props: { literal: { children: "Name" } } },
  {
    key: "iName",
    component: "Input",
    props: { expr: "({ value: scopes.root.draftName, placeholder: 'Product name' })" },
    callbacks: { onChange: [{ set: "scopes.root.draftName", expr: "evt.value" }] },
  },
  { key: "fSku", component: "Field", children: ["lSku", "iSku"] },
  { key: "lSku", component: "FieldLabel", props: { literal: { children: "SKU" } } },
  {
    key: "iSku",
    component: "Input",
    props: { expr: "({ value: scopes.root.draftSku, placeholder: 'SKU-0000' })" },
    callbacks: { onChange: [{ set: "scopes.root.draftSku", expr: "evt.value" }] },
  },
  { key: "fCat", component: "Field", children: ["lCat", "iCat"] },
  { key: "lCat", component: "FieldLabel", props: { literal: { children: "Category" } } },
  {
    key: "iCat",
    component: "Select",
    props: {
      expr: "({ value: scopes.root.draftCategory, placeholder: 'Select category', options: (scopes.root.categories || []).map(c => ({ label: c.name, value: c.name })) })",
    },
    callbacks: { onChange: [{ set: "scopes.root.draftCategory", expr: "evt.value" }] },
  },
  { key: "fStock", component: "Field", children: ["lStock", "iStock"] },
  { key: "lStock", component: "FieldLabel", props: { literal: { children: "Stock" } } },
  {
    key: "iStock",
    component: "NumberInput",
    props: { expr: "({ value: scopes.root.draftStock, min: 0 })" },
    callbacks: { onChange: [{ set: "scopes.root.draftStock", expr: "evt.value" }] },
  },
  { key: "fPrice", component: "Field", children: ["lPrice", "iPrice"] },
  { key: "lPrice", component: "FieldLabel", props: { literal: { children: "Price" } } },
  {
    key: "iPrice",
    component: "CurrencyInput",
    props: { expr: "({ value: scopes.root.draftPrice })" },
    callbacks: { onChange: [{ set: "scopes.root.draftPrice", expr: "evt.value" }] },
  },
  {
    key: "formActions",
    component: "FlexRow",
    props: { literal: { justify: "end", gap: "2" } },
    children: ["cancelBtn", "saveBtn"],
  },
  {
    key: "cancelBtn",
    component: "Button",
    props: { literal: { variant: "outline", children: "Cancel" } },
    callbacks: { onClick: [{ set: "scopes.root.draftOpen", literal: false }] },
  },
  {
    key: "saveBtn",
    component: "Button",
    props: { literal: { children: "Save product" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._op",
          expr: "scopes.root.draftId ? await updateProduct({ id: scopes.root.draftId, name: scopes.root.draftName, sku: scopes.root.draftSku, category: scopes.root.draftCategory, stock: scopes.root.draftStock, price: scopes.root.draftPrice }) : await createProduct({ name: scopes.root.draftName, sku: scopes.root.draftSku, category: scopes.root.draftCategory, stock: scopes.root.draftStock, price: scopes.root.draftPrice })",
        },
        { set: "scopes.root.products", expr: "await listProducts()" },
        { set: "scopes.root.categories", expr: "await getCategoryBreakdown()" },
        { set: "scopes.root.draftOpen", literal: false },
      ],
    },
  },
];

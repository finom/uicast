// biome-ignore-all format: one entry per line, as in a document
import type { Example } from ".";

const VIRTUAL_LIST_NAMES = ["Mara Voss", "Elin Cho", "Sam Okafor", "Priya Nair", "Tom Reyes", "Ines Duarte", "Owen Blake", "Wyatt Chen"];
const VIRTUAL_LIST_STATUSES = ["Shipped", "Processing", "Pending", "Delivered"];
const VIRTUAL_LIST_ITEMS = Array.from({ length: 40 }, (_, i) => ({
  id: `order-${1000 + i}`,
  primary: `Order #${1000 + i} — ${VIRTUAL_LIST_STATUSES[i % VIRTUAL_LIST_STATUSES.length]}`,
  secondary: `${VIRTUAL_LIST_NAMES[i % VIRTUAL_LIST_NAMES.length]} · $${(45 + i * 3.5).toFixed(2)}`,
}));

export const data: Record<string, Example> = {
  DataGrid: [
    { key: "grid-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.selected", literal: null }], children: ["grid", "grid-selected"] },
    { key: "grid", component: "DataGrid", props: { literal: { columns: [{ key: "sku", header: "SKU", width: "sm" }, { key: "name", header: "Product" }, { key: "stock", header: "Stock", width: "xs" }, { key: "price", header: "Price", width: "sm" }], rows: [{ sku: "SKU-1001", name: "Walnut Bookshelf", stock: 42, price: "$189.99" }, { sku: "SKU-1002", name: "Oak Side Table", stock: 15, price: "$84.50" }, { sku: "SKU-1003", name: "Linen Armchair", stock: 8, price: "$245.00" }, { sku: "SKU-1004", name: "Brass Floor Lamp", stock: 23, price: "$96.75" }, { sku: "SKU-1005", name: "Ceramic Vase Set", stock: 60, price: "$32.00" }, { sku: "SKU-1006", name: "Wool Area Rug", stock: 5, price: "$159.00" }], maxHeight: 220, striped: true } }, callbacks: { onRowClick: [{ set: "scopes.root.selected", expr: "evt.row.name + ' — ' + evt.row.price" }] } },
    { key: "grid-selected", component: "Typography", props: { expr: "({ text: scopes.root.selected ? 'Selected: ' + scopes.root.selected : 'Click a row to select it', variant: 'muted' })" } },
  ],
  KanbanBoard: [
    { key: "board-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.columns", literal: [{ id: "backlog", title: "Backlog", cards: [{ id: "card-1", title: "Restock walnut shelving", tag: "Supplier", tagColor: "blue" }, { id: "card-2", title: "Reprice ceramic vases", description: "Margin below 20%", tag: "Pricing", tagColor: "amber" }] }, { id: "in-progress", title: "In Progress", cards: [{ id: "card-3", title: "Count Q3 stockroom", description: "Aisles 1-4 left", tag: "Audit", tagColor: "violet" }] }, { id: "done", title: "Done", cards: [{ id: "card-4", title: "Renew Nordform contract", tag: "Supplier", tagColor: "green" }] }] }, { set: "scopes.root.lastClicked", literal: null }], children: ["board", "board-clicked"] },
    { key: "board", component: "KanbanBoard", props: { expr: "({ columns: scopes.root.columns })" }, callbacks: { onCardClick: [{ set: "scopes.root.lastClicked", expr: "evt.cardId" }], onCardMove: [{ set: "scopes.root.columns", expr: "evt.columns" }] } },
    { key: "board-clicked", component: "Typography", props: { expr: "({ text: scopes.root.lastClicked ? 'Last clicked: ' + scopes.root.lastClicked : 'Click or drag a card', variant: 'muted' })" } },
  ],
  Table: [
    { key: "table", component: "Table", seed: [{ set: "scopes.root.orders", literal: [{ id: 1024, customer: "Mara Voss", status: "Shipped", total: 128.5 }, { id: 1025, customer: "Elin Cho", status: "Processing", total: 64 }, { id: 1026, customer: "Sam Okafor", status: "Shipped", total: 212.75 }, { id: 1027, customer: "Priya Nair", status: "Pending", total: 39.99 }, { id: 1028, customer: "Tom Reyes", status: "Cancelled", total: 88.2 }] }, { set: "scopes.root.selectedId", literal: null }], children: ["thead", "tbody", "tfoot"] },
    { key: "thead", component: "TableHeader", children: ["hrow"] },
    { key: "hrow", component: "TableRow", children: ["h-order", "h-customer", "h-status", "h-total"] },
    { key: "h-order", component: "TableHead", props: { literal: { text: "Order" } } },
    { key: "h-customer", component: "TableHead", props: { literal: { text: "Customer" } } },
    { key: "h-status", component: "TableHead", props: { literal: { text: "Status" } } },
    { key: "h-total", component: "TableHead", props: { literal: { text: "Total" } } },
    { key: "tbody", component: "TableBody", children: ["row"] },
    { key: "row", component: "TableRow", each: "scopes.root.orders", as: "order", keyBy: "id", callbacks: { onClick: [{ set: "scopes.root.selectedId", expr: "currentValue === scopes.$order.id ? null : scopes.$order.id" }] }, children: ["c-order", "c-customer", "c-status", "c-total"] },
    { key: "c-order", component: "TableCell", props: { expr: "({ text: '#' + scopes.order.id })" } },
    { key: "c-customer", component: "TableCell", props: { expr: "({ text: scopes.order.customer })" } },
    { key: "c-status", component: "TableCell", props: { expr: "({ text: scopes.order.status + (scopes.$order.id === scopes.root.selectedId ? ' (selected)' : '') })" } },
    { key: "c-total", component: "TableCell", props: { expr: "({ text: '$' + scopes.order.total.toFixed(2) })" } },
    { key: "tfoot", component: "TableFooter", children: ["frow"] },
    { key: "frow", component: "TableRow", children: ["f-order", "f-customer", "f-status", "f-total"] },
    { key: "f-order", component: "TableCell", props: { literal: { text: "" } } },
    { key: "f-customer", component: "TableCell", props: { literal: { text: "Total" } } },
    { key: "f-status", component: "TableCell", props: { literal: { text: "" } } },
    { key: "f-total", component: "TableCell", props: { expr: "({ text: '$' + scopes.root.orders.reduce((s, o) => s + o.total, 0).toFixed(2) })" } },
  ],
  TableBody: "Table",
  TableCell: "Table",
  TableFooter: "Table",
  TableHead: "Table",
  TableHeader: "Table",
  TableRow: "Table",
  VirtualList: [
    { key: "vlist-root", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.items", literal: VIRTUAL_LIST_ITEMS }, { set: "scopes.root.selected", literal: null }], children: ["vlist", "vlist-selected"] },
    { key: "vlist", component: "VirtualList", props: { expr: "({ items: scopes.root.items, height: 240, itemHeight: 40 })" }, callbacks: { onItemClick: [{ set: "scopes.root.selected", expr: "scopes.root.items.find(i => i.id === evt.id)?.primary ?? evt.id" }] } },
    { key: "vlist-selected", component: "Typography", props: { expr: "({ text: scopes.root.selected ? 'Selected: ' + scopes.root.selected : 'Click a row', variant: 'muted' })" } },
  ],
};

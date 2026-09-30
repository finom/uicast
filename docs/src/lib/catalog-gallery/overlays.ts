// biome-ignore-all format: one entry per line, as in a document
import type { Example } from ".";

export const overlays: Record<string, Example> = {
  DropdownMenu: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "2", align: "center" } }, seed: [{ set: "scopes.root.status", literal: "" }], children: ["menu", "result"] },
    { key: "menu", component: "DropdownMenu", props: { literal: { triggerLabel: "Row actions" } }, children: ["edit-item", "delete-item"] },
    { key: "edit-item", component: "DropdownMenuItem", props: { literal: { text: "Edit" } }, callbacks: { onClick: [{ set: "scopes.root.status", literal: "Editing order #1042." }] } },
    { key: "delete-item", component: "DropdownMenuItem", props: { literal: { text: "Delete", variant: "destructive" } }, callbacks: { onClick: [{ set: "scopes.root.status", literal: "Order #1042 deleted." }] } },
    { key: "result", component: "Typography", props: { expr: "({ text: scopes.root.status })" }, hidden: "!scopes.root.status" },
  ],
  DropdownMenuItem: "DropdownMenu", // a part: shown in the DropdownMenu example
  Modal: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.open", literal: false }, { set: "scopes.root.filtersOpen", literal: false }], children: ["open-btn", "filter-btn", "modal", "drawer"] },
    { key: "open-btn", component: "Button", props: { literal: { text: "Edit product" } }, callbacks: { onClick: [{ set: "scopes.root.open", literal: true }] } },
    { key: "filter-btn", component: "Button", props: { literal: { text: "Filter orders", variant: "outline" } }, callbacks: { onClick: [{ set: "scopes.root.filtersOpen", literal: true }] } },
    { key: "modal", component: "Modal", props: { expr: "({ open: scopes.root.open, title: 'Edit product', description: 'Update the price and stock count.' })" }, callbacks: { onOpenChange: [{ set: "scopes.root.open", expr: "evt.open" }] }, children: ["body"] },
    { key: "body", component: "Typography", props: { literal: { text: "Price and stock fields go here." } } },
    { key: "drawer", component: "Modal", props: { expr: "({ open: scopes.root.filtersOpen, title: 'Filter orders', description: 'Narrow the list by status and date.', side: 'right' })" }, callbacks: { onOpenChange: [{ set: "scopes.root.filtersOpen", expr: "evt.open" }] }, children: ["drawer-body"] },
    { key: "drawer-body", component: "Typography", props: { literal: { text: "Status, date range, and supplier filters go here." } } },
  ],
  Popover: [
    { key: "popover", component: "Popover", props: { expr: "({ open: scopes.root.open, triggerLabel: 'Order total' })" }, seed: [{ set: "scopes.root.open", literal: false }], callbacks: { onOpenChange: [{ set: "scopes.root.open", expr: "evt.open" }] }, children: ["body"] },
    { key: "body", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["subtotal", "tax", "total"] },
    { key: "subtotal", component: "Typography", props: { literal: { text: "Subtotal $84.00", variant: "muted" } } },
    { key: "tax", component: "Typography", props: { literal: { text: "Tax $6.72", variant: "muted" } } },
    { key: "total", component: "Typography", props: { literal: { text: "Total $90.72" } } },
  ],
  Tooltip: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "1", align: "center" } }, children: ["label", "help"] },
    { key: "label", component: "Typography", props: { literal: { text: "SKU" } } },
    { key: "help", component: "Tooltip", props: { literal: { content: "Stock keeping unit. Must be unique across the catalog." } }, children: ["help-icon"] },
    { key: "help-icon", component: "Icon", props: { literal: { name: "HelpCircle", size: "sm", color: "muted" } } },
  ],
};

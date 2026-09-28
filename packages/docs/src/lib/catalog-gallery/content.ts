// biome-ignore-all format: one entry per line, as in a document
import type { Example } from ".";

export const content: Record<string, Example> = {
  Alert: [
    { key: "col", component: "FlexCol", props: { literal: { gap: "2" } }, children: ["info", "success", "warning", "error"] },
    { key: "info", component: "Alert", props: { literal: { title: "Tip", description: "Reorder points update after each stock count." } } },
    { key: "success", component: "Alert", props: { literal: { title: "Order #1042 shipped", status: "success", dismissible: true } } },
    { key: "warning", component: "Alert", props: { literal: { title: "Low stock", status: "warning" } }, children: ["warning-text"] },
    { key: "warning-text", component: "Typography", props: { literal: { text: "Walnut Bookshelf (8 left) and Birch Standing Desk (15 left) are below their reorder points." } } },
    { key: "error", component: "Alert", props: { literal: { title: "Payment failed", description: "The card for order #1044 was declined.", status: "error" } } },
  ],

  Avatar: [
    { key: "avatar", component: "Avatar", props: { literal: { fallback: "PS", size: "lg" } } },
  ],

  AvatarGroup: [
    { key: "team", component: "AvatarGroup", props: { literal: { avatars: [{ fallback: "AM" }, { fallback: "BS" }, { fallback: "CT" }, { fallback: "DK" }, { fallback: "EF" }, { fallback: "GH" }], max: 4 } } },
  ],

  Badge: [
    { key: "col", component: "FlexCol", props: { literal: { gap: "3" } }, seed: [{ set: "scopes.root.filters", literal: [{ id: "cat", label: "Ceramics" }, { id: "stock", label: "In stock" }, { id: "price", label: "Under $20" }] }], children: ["row", "chips"] },
    { key: "row", component: "FlexRow", props: { literal: { gap: "2" } }, children: ["b1", "b2", "b3", "b4"] },
    { key: "b1", component: "Badge", props: { literal: { text: "Active", variant: "default" } } },
    { key: "b2", component: "Badge", props: { literal: { text: "Draft", variant: "secondary" } } },
    { key: "b3", component: "Badge", props: { literal: { text: "Out of stock", variant: "destructive" } } },
    { key: "b4", component: "Badge", props: { literal: { text: "Archived", variant: "outline" } } },
    { key: "chips", component: "FlexRow", props: { literal: { gap: "2", wrap: true } }, children: ["chip"] },
    { key: "chip", component: "Badge", each: "scopes.root.filters", as: "filter", keyBy: "id", props: { expr: "({ text: scopes.filter.label, variant: 'secondary', removable: true })" }, callbacks: { onRemove: [{ set: "scopes.root.filters", expr: "currentValue.filter(f => f.id !== scopes.filter.id)" }] } },
  ],


  Calendar: [
    { key: "cal", component: "Calendar", props: { expr: "({ selected: scopes.root.selected })" }, seed: [{ set: "scopes.root.selected", literal: "2026-09-27" }], callbacks: { onSelect: [{ set: "scopes.root.selected", expr: "evt.date" }] } },
  ],

  Carousel: [
    { key: "carousel", component: "Carousel", props: { literal: { orientation: "horizontal", loop: true } }, children: ["s1", "s2", "s3"] },
    { key: "s1", component: "Card", props: { literal: { title: "Ceramic Mug", description: "$14.00 · 128 in stock" } } },
    { key: "s2", component: "Card", props: { literal: { title: "Steel Water Bottle", description: "$22.00 · 64 in stock" } } },
    { key: "s3", component: "Card", props: { literal: { title: "Canvas Tote Bag", description: "$18.00 · 40 in stock" } } },
  ],

  CodeBlock: [
    { key: "code", component: "CodeBlock", props: { literal: { code: "{\n  \"sku\": \"MUG-CER-01\",\n  \"stock\": 128,\n  \"price\": 14.00\n}", language: "json", showLineNumbers: true } } },
  ],

  CountdownTimer: [
    { key: "timer", component: "CountdownTimer", props: { literal: { targetDate: "2026-10-15T18:00:00Z" } } },
  ],

  DateTime: [
    { key: "dt", component: "DateTime", seed: [{ set: "scopes.root.updatedAt", expr: "Date.now() - 3 * 60 * 60 * 1000" }], props: { expr: "({ value: scopes.root.updatedAt, format: 'relative', prefix: 'Updated' })" } },
  ],

  DescriptionList: [
    { key: "details", component: "DescriptionList", props: { literal: { items: [{ label: "Order", value: "#10482" }, { label: "Customer", value: "Nordic Kitchen Co." }, { label: "Status", value: "Shipped" }, { label: "Total", value: "$482.00" }], layout: "horizontal" } } },
  ],

  DiffViewer: [
    { key: "diff", component: "DiffViewer", props: { literal: { oldText: "name: Ceramic Mug\nprice: 12.00\nstock: 96", newText: "name: Ceramic Mug\nprice: 14.00\nstock: 128" } } },
  ],

  EmptyState: [
    { key: "empty", component: "EmptyState", props: { literal: { title: "No suppliers yet", description: "Add a supplier to start tracking restocks." } }, children: ["add-btn"] },
    { key: "add-btn", component: "Button", props: { literal: { text: "Add supplier" } } },
  ],

  Heading: [
    { key: "h", component: "Heading", props: { literal: { level: "2", text: "Inventory overview" } } },
  ],

  HighlightedText: [
    { key: "hl", component: "HighlightedText", props: { literal: { text: "Results for ceramic mug: Ceramic Mug (blue), ceramic mug set of 4, travel mug", highlight: "ceramic mug" } } },
  ],

  Icon: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "4" } }, children: ["i1", "i2", "i3", "i4"] },
    { key: "i1", component: "Icon", props: { literal: { name: "Package", color: "primary" } } },
    { key: "i2", component: "Icon", props: { literal: { name: "Truck", color: "muted" } } },
    { key: "i3", component: "Icon", props: { literal: { name: "ShoppingCart", color: "success" } } },
    { key: "i4", component: "Icon", props: { literal: { name: "DollarSign", color: "warning" } } },
  ],

  KBD: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "1" } }, children: ["t1", "k", "t2"] },
    { key: "t1", component: "Typography", props: { literal: { text: "Press" } } },
    { key: "k", component: "KBD", props: { literal: { keys: ["Cmd", "K"] } } },
    { key: "t2", component: "Typography", props: { literal: { text: "to search products." } } },
  ],

  List: [
    { key: "list", component: "List", props: { literal: { ordered: true } }, children: ["l1", "l2", "l3"] },
    { key: "l1", component: "Typography", props: { literal: { text: "Confirm supplier invoice" } } },
    { key: "l2", component: "Typography", props: { literal: { text: "Update stock counts" } } },
    { key: "l3", component: "Typography", props: { literal: { text: "Notify warehouse team" } } },
  ],

  LocationMap: [
    { key: "map", component: "LocationMap", props: { literal: { center: { lat: 50.5, lng: 10 }, zoom: 4, markers: [{ lat: 52.52, lng: 13.405, label: "Berlin warehouse" }, { lat: 48.8566, lng: 2.3522, label: "Paris distribution" }, { lat: 41.9028, lng: 12.4964, label: "Rome supplier" }], width: 560, height: 300 } } },
  ],

  NotificationBadge: [
    { key: "badge", component: "NotificationBadge", props: { literal: { count: 5 } }, children: ["bell"] },
    { key: "bell", component: "Icon", props: { literal: { name: "Bell", size: "lg" } } },
  ],

  Picture: [
    { key: "pic", component: "Picture", props: { literal: { src: "/uicast-hero-light.svg", alt: "Product photo placeholder", width: "xl", height: "xl", rounded: "lg", objectFit: "contain" } } },
  ],

  ProgressBar: [
    { key: "col", component: "FlexCol", props: { literal: { gap: "3" } }, children: ["p1", "p2", "p3"] },
    { key: "p1", component: "ProgressBar", props: { literal: { value: 82, showLabel: true, color: "success" } } },
    { key: "p2", component: "ProgressBar", props: { literal: { value: 45, showLabel: true, color: "warning" } } },
    { key: "p3", component: "ProgressBar", props: { literal: { value: 12, showLabel: true, color: "error" } } },
  ],

  QRCode: [
    { key: "qr", component: "QRCode", props: { literal: { value: "SKU:MUG-CER-01", size: 160 } } },
  ],

  Spinner: [
    { key: "spinner", component: "Spinner", props: { literal: { size: "lg", label: "Loading orders…" } } },
  ],

  Stat: [
    { key: "stat", component: "Stat", props: { literal: { label: "Revenue", value: "$48,200", trend: "up", trendValue: "+8%", helpText: "vs. last month" } } },
  ],


  Timeline: [
    { key: "timeline", component: "Timeline", props: { literal: { items: [{ title: "Order placed", time: "Sep 20", icon: "ShoppingCart" }, { title: "Payment confirmed", time: "Sep 20", icon: "CheckCircle", variant: "success" }, { title: "Shipped", time: "Sep 22", icon: "Truck" }, { title: "Delivery delayed", description: "Carrier reported a weather delay.", time: "Sep 24", icon: "AlertTriangle", variant: "warning" }] } } },
  ],

  Toast: [
    { key: "root", component: "FlexCol", props: { literal: { gap: "2", align: "start" } }, children: ["trigger", "toast"], seed: [{ set: "scopes.root.toastOpen", literal: false }] },
    { key: "trigger", component: "Button", props: { literal: { text: "Save changes" } }, callbacks: { onClick: [{ set: "scopes.root.toastOpen", literal: true }] } },
    { key: "toast", component: "Toast", props: { expr: "({ open: scopes.root.toastOpen, title: 'Changes saved', description: 'Inventory levels updated.', variant: 'success', position: 'bottom-right' })" }, callbacks: { onClose: [{ set: "scopes.root.toastOpen", literal: false }] } },
  ],

  TreeView: [
    { key: "tree", component: "TreeView", props: { literal: { items: [{ label: "Kitchen", icon: "Package", expanded: true, children: [{ label: "Mugs" }, { label: "Cookware" }] }, { label: "Storage", icon: "Archive", children: [{ label: "Jars" }, { label: "Bins" }] }] } } },
  ],

  TruncatedText: [
    { key: "trunc", component: "TruncatedText", props: { literal: { text: "This supplier agreement covers minimum order quantities, lead times, and return policies for all ceramic and glassware products sourced from the Lisbon workshop. It renews automatically each year unless either party cancels 60 days in advance. Price changes need 30 days' written notice, and damaged goods are replaced at the supplier's cost within two weeks of the report.", maxLines: 2 } } },
  ],

  Typography: [
    { key: "col", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["t1", "t2", "t3"] },
    { key: "t1", component: "Typography", props: { literal: { text: "Order #10482", variant: "lead", as: "p" } } },
    { key: "t2", component: "Typography", props: { literal: { text: "Placed by Nordic Kitchen Co.", variant: "body", as: "p" } } },
    { key: "t3", component: "Typography", props: { literal: { text: "Updated 2 hours ago", variant: "muted", as: "p" } } },
  ],
};

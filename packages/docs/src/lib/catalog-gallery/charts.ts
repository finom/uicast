// biome-ignore-all format: one entry per line, as in a document
import type { Example } from ".";

export const charts: Record<string, Example> = {
  BarChart: [
    { key: "card", component: "Card", props: { literal: { title: "Orders by month", description: "Online and in store, against the target" } }, children: ["chart"] },
    { key: "chart", component: "BarChart", props: { literal: { data: [{ month: "Jan", online: 120, inStore: 80, target: 190 }, { month: "Feb", online: 132, inStore: 85, target: 200 }, { month: "Mar", online: 148, inStore: 90, target: 215 }, { month: "Apr", online: 160, inStore: 96, target: 230 }, { month: "May", online: 171, inStore: 102, target: 245 }, { month: "Jun", online: 190, inStore: 110, target: 260 }], xKey: "month", yKeys: ["online", "inStore"], lineKeys: ["target"], height: 260 } } },
  ],
  FunnelChart: [
    { key: "card", component: "Card", props: { literal: { title: "Order fulfilment funnel" } }, children: ["chart"] },
    { key: "chart", component: "FunnelChart", props: { literal: { data: [{ name: "Orders placed", value: 1000 }, { name: "Picked", value: 860 }, { name: "Packed", value: 780 }, { name: "Shipped", value: 740 }, { name: "Delivered", value: 700 }], height: 260 } } },
  ],
  GanttChart: [
    { key: "card", component: "Card", props: { literal: { title: "Warehouse move schedule", description: "16-day plan" } }, children: ["chart"] },
    { key: "chart", component: "GanttChart", props: { literal: { tasks: [{ name: "Pack current site", start: 0, duration: 3, progress: 100 }, { name: "Move racking", start: 2, duration: 4, progress: 100 }, { name: "Transport", start: 5, duration: 2, progress: 60 }, { name: "Unpack new site", start: 6, duration: 5, progress: 20 }, { name: "Restock shelves", start: 10, duration: 4 }, { name: "Go live", start: 14, duration: 1 }], totalUnits: 16 } } },
  ],
  GaugeChart: [
    { key: "gauge", component: "GaugeChart", props: { literal: { value: 92, label: "On-time fulfilment", color: "green", height: 200 } } },
  ],
  Heatmap: [
    { key: "card", component: "Card", props: { literal: { title: "Orders processed by day and shift" } }, children: ["chart"] },
    { key: "chart", component: "Heatmap", props: { literal: { data: [{ row: "Mon", col: "Morning", value: 18 }, { row: "Mon", col: "Afternoon", value: 32 }, { row: "Mon", col: "Evening", value: 22 }, { row: "Wed", col: "Morning", value: 20 }, { row: "Wed", col: "Afternoon", value: 35 }, { row: "Wed", col: "Evening", value: 26 }, { row: "Fri", col: "Morning", value: 24 }, { row: "Fri", col: "Afternoon", value: 44 }, { row: "Fri", col: "Evening", value: 38 }, { row: "Sat", col: "Morning", value: 30 }, { row: "Sat", col: "Afternoon", value: 52 }, { row: "Sat", col: "Evening", value: 46 }], rows: ["Mon", "Wed", "Fri", "Sat"], cols: ["Morning", "Afternoon", "Evening"], minColor: "slate", maxColor: "blue" } } },
  ],
  LineChart: [
    { key: "card", component: "Card", props: { literal: { title: "Orders per day", description: "Last 7 days, by channel" } }, children: ["chart"] },
    { key: "chart", component: "LineChart", props: { literal: { data: [{ day: "Mon", online: 42, inStore: 18 }, { day: "Tue", online: 38, inStore: 22 }, { day: "Wed", online: 51, inStore: 19 }, { day: "Thu", online: 47, inStore: 25 }, { day: "Fri", online: 63, inStore: 31 }, { day: "Sat", online: 71, inStore: 44 }, { day: "Sun", online: 54, inStore: 39 }], xKey: "day", yKeys: ["online", "inStore"], height: 240 } } },
  ],
  PieChart: [
    { key: "card", component: "Card", props: { literal: { title: "Stock value by category" } }, children: ["chart"] },
    { key: "chart", component: "PieChart", props: { literal: { data: [{ name: "Electronics", value: 28400 }, { name: "Furniture", value: 19800 }, { name: "Lighting", value: 6200 }, { name: "Accessories", value: 9100 }, { name: "Office", value: 4300 }], donut: true, showLabels: false, centerLabel: "$67.8k", height: 260 } } },
  ],
  RadarChart: [
    { key: "card", component: "Card", props: { literal: { title: "Supplier scorecard", description: "Nordform Werk vs Circuitry Direct" } }, children: ["chart"] },
    { key: "chart", component: "RadarChart", props: { literal: { data: [{ metric: "Price", nordform: 72, circuitry: 85 }, { metric: "Quality", nordform: 88, circuitry: 80 }, { metric: "Delivery", nordform: 65, circuitry: 90 }, { metric: "Support", nordform: 70, circuitry: 78 }, { metric: "Flexibility", nordform: 75, circuitry: 68 }], dataKey: "metric", valueKeys: ["nordform", "circuitry"], height: 260 } } },
  ],
  ScatterChart: [
    { key: "card", component: "Card", props: { literal: { title: "Suppliers by lead time, orders and spend" } }, children: ["chart"] },
    { key: "chart", component: "ScatterChart", props: { literal: { data: [{ supplier: "Nordform Werk", leadDays: 21, orders: 12, spend: 9400 }, { supplier: "Circuitry Direct", leadDays: 10, orders: 34, spend: 12800 }, { supplier: "Lumen Trade Co.", leadDays: 7, orders: 22, spend: 5100 }, { supplier: "Atelier Supply", leadDays: 5, orders: 40, spend: 4200 }, { supplier: "Papyrus Office", leadDays: 4, orders: 26, spend: 3100 }, { supplier: "Storeworks Ltd", leadDays: 12, orders: 15, spend: 6300 }], xKey: "leadDays", yKey: "orders", sizeKey: "spend", name: "Suppliers", height: 260 } } },
  ],
  Sparkline: [
    { key: "row", component: "FlexRow", props: { literal: { gap: "3", align: "center" } }, children: ["label", "spark"] },
    { key: "label", component: "Typography", props: { literal: { text: "Orders this week", variant: "muted" } } },
    { key: "spark", component: "Sparkline", props: { literal: { data: [12, 18, 15, 22, 26, 24, 30], width: 120, height: 32, color: "green", filled: true } } },
  ],
  TreemapChart: [
    { key: "card", component: "Card", props: { literal: { title: "Warehouse space by category (sq ft)" } }, children: ["chart"] },
    { key: "chart", component: "TreemapChart", props: { literal: { data: [{ name: "Furniture", value: 480 }, { name: "Electronics", value: 260 }, { name: "Storage", value: 220 }, { name: "Lighting", value: 140 }, { name: "Accessories", value: 120 }, { name: "Office", value: 90 }], height: 260 } } },
  ],
  WaterfallChart: [
    { key: "card", component: "Card", props: { literal: { title: "Monthly profit breakdown" } }, children: ["chart"] },
    { key: "chart", component: "WaterfallChart", props: { literal: { data: [{ name: "Revenue", value: 52000 }, { name: "COGS", value: -21000 }, { name: "Payroll", value: -14000 }, { name: "Rent", value: -4000 }, { name: "Other", value: -3000 }, { name: "Net profit", value: 10000, isTotal: true }], height: 260 } } },
  ],
};

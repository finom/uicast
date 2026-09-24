import type { ComponentEntry } from "@uicast/core";

// Hand-written, not generated: every section waits on `delay`, so a reload shows the skeletons at each level.
export const slowSeedsEntries: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      {
        set: "scopes.root.intro",
        expr: "delay({ ms: 1000, value: 'Each section waits on its own seed, from 0.8 to 4 seconds, and a nested section waits for its parent first. Reload to watch the skeletons again.' })",
      },
    ],
    children: ["header", "stats", "middle", "nested", "bottom"],
  },
  { key: "header", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["title", "intro"] },
  { key: "title", component: "Heading", props: { literal: { level: "1", text: "Slow seeds" } } },
  { key: "intro", component: "Typography", props: { expr: "({ text: scopes.root.intro, variant: 'muted', as: 'p' })" } },

  {
    key: "stats",
    component: "Grid",
    props: { literal: { columns: "4", gap: "4" } },
    children: ["st-visitors", "st-signups", "st-conversion", "st-revenue"],
  },
  {
    key: "st-visitors",
    component: "Stat",
    seed: [{ set: "scopes.root.visitors", expr: "delay({ ms: 800, value: 12840 })" }],
    props: { expr: "({ label: 'Visitors', value: scopes.root.visitors.toLocaleString(), helpText: '0.8 s seed' })" },
  },
  {
    key: "st-signups",
    component: "Stat",
    seed: [{ set: "scopes.root.signupCount", expr: "delay({ ms: 1600, value: 342 })" }],
    props: { expr: "({ label: 'Signups', value: scopes.root.signupCount, helpText: '1.6 s seed' })" },
  },
  {
    key: "st-conversion",
    component: "Stat",
    seed: [{ set: "scopes.root.conversion", expr: "delay({ ms: 2400, value: 2.7 })" }],
    props: { expr: "({ label: 'Conversion', value: scopes.root.conversion.toFixed(1) + '%', helpText: '2.4 s seed' })" },
  },
  {
    key: "st-revenue",
    component: "Stat",
    seed: [{ set: "scopes.root.revenue", expr: "delay({ ms: 3200, value: 18420 })" }],
    props: { expr: "({ label: 'Revenue', value: '$' + scopes.root.revenue.toLocaleString(), helpText: '3.2 s seed' })" },
  },

  { key: "middle", component: "Grid", props: { literal: { columns: "2", gap: "4" } }, children: ["chart-card", "table-card"] },
  {
    key: "chart-card",
    component: "Card",
    props: { literal: { title: "Visits by weekday", description: "2 s seed" } },
    seed: [
      {
        set: "scopes.root.weekdays",
        expr: "delay({ ms: 2000, value: [{ day: 'Mon', visits: 1840 }, { day: 'Tue', visits: 2210 }, { day: 'Wed', visits: 2475 }, { day: 'Thu', visits: 2130 }, { day: 'Fri', visits: 1960 }, { day: 'Sat', visits: 1215 }, { day: 'Sun', visits: 1010 }] })",
      },
    ],
    children: ["chart"],
  },
  {
    key: "chart",
    component: "BarChart",
    props: { expr: "({ data: scopes.root.weekdays, xKey: 'day', yKeys: ['visits'], height: 220 })" },
  },
  {
    key: "table-card",
    component: "Card",
    props: { literal: { title: "Latest signups", description: "3.5 s seed" } },
    seed: [
      {
        set: "scopes.root.signups",
        expr: "delay({ ms: 3500, value: [{ name: 'Ada Park', plan: 'Pro', joined: 'Sep 21' }, { name: 'Luis Ortega', plan: 'Team', joined: 'Sep 20' }, { name: 'Mei Chen', plan: 'Free', joined: 'Sep 20' }, { name: 'Omar Haddad', plan: 'Pro', joined: 'Sep 19' }, { name: 'Sara Lind', plan: 'Team', joined: 'Sep 18' }] })",
      },
    ],
    children: ["su-table"],
  },
  { key: "su-table", component: "Table", children: ["su-head", "su-body"] },
  { key: "su-head", component: "TableHeader", children: ["su-hrow"] },
  { key: "su-hrow", component: "TableRow", children: ["su-h-name", "su-h-plan", "su-h-joined"] },
  { key: "su-h-name", component: "TableHead", props: { literal: { text: "Name" } } },
  { key: "su-h-plan", component: "TableHead", props: { literal: { text: "Plan" } } },
  { key: "su-h-joined", component: "TableHead", props: { literal: { text: "Joined" } } },
  { key: "su-body", component: "TableBody", children: ["su-row"] },
  {
    key: "su-row",
    component: "TableRow",
    each: "scopes.root.signups",
    as: "su",
    children: ["su-name", "su-plan", "su-joined"],
  },
  { key: "su-name", component: "TableCell", props: { expr: "({ text: scopes.su.name })" } },
  { key: "su-plan", component: "TableCell", props: { expr: "({ text: scopes.su.plan })" } },
  { key: "su-joined", component: "TableCell", props: { expr: "({ text: scopes.su.joined })" } },

  {
    key: "nested",
    component: "Card",
    props: {
      literal: {
        title: "Nested seeds",
        description: "Each level mounts once the level above it has loaded: 1 s, then 1.5 s, then 2 s.",
      },
    },
    seed: [{ set: "scopes.root.level1", expr: "delay({ ms: 1000, value: 'The first level loaded.' })" }],
    children: ["level1-text", "level2"],
  },
  { key: "level1-text", component: "Typography", props: { expr: "({ text: scopes.root.level1, as: 'p' })" } },
  {
    key: "level2",
    component: "Card",
    props: { literal: { title: "Second level" } },
    seed: [{ set: "scopes.root.level2", expr: "delay({ ms: 1500, value: 'The second level loaded.' })" }],
    children: ["level2-text", "level3"],
  },
  { key: "level2-text", component: "Typography", props: { expr: "({ text: scopes.root.level2, as: 'p' })" } },
  {
    key: "level3",
    component: "DescriptionList",
    seed: [
      {
        set: "scopes.root.level3",
        expr: "delay({ ms: 2000, value: [{ label: 'Region', value: 'eu-west' }, { label: 'Uptime', value: '99.98%' }, { label: 'Queue', value: '12 jobs' }, { label: 'Build', value: '#4821' }] })",
      },
    ],
    props: { expr: "({ items: scopes.root.level3, columns: '2' })" },
  },

  { key: "bottom", component: "Grid", props: { literal: { columns: "2", gap: "4" } }, children: ["tags-card", "low-card"] },
  {
    key: "tags-card",
    component: "Card",
    props: { literal: { title: "A list with its own seed", description: "4 s seed. Three items stand in until the length is known." } },
    children: ["tags"],
  },
  { key: "tags", component: "FlexRow", props: { literal: { gap: "2", wrap: true } }, children: ["tag"] },
  {
    key: "tag",
    component: "Badge",
    each: "scopes.root.tags",
    as: "tg",
    seed: [{ set: "scopes.root.tags", expr: "delay({ ms: 4000, value: ['fast', 'slow', 'slower', 'cached', 'streamed', 'seeded'] })" }],
    props: { expr: "({ text: scopes.tg.$$value, variant: 'secondary' })" },
  },
  {
    key: "low-card",
    component: "Card",
    props: {
      literal: {
        title: "Real data, late",
        description: "Waits 2.5 s, then reads the catalog. The empty state is hidden, so the skeleton leaves it out.",
      },
    },
    seed: [
      { set: "scopes.root.lowGate", expr: "delay({ ms: 2500, value: true })" },
      { set: "scopes.root.low", expr: "scopes.root.lowGate && listProducts({ stockAtMost: 20, limit: 5 })" },
    ],
    children: ["low-item", "low-empty"],
  },
  {
    key: "low-item",
    component: "Typography",
    each: "scopes.root.low.items",
    as: "lp",
    props: { expr: "({ text: scopes.lp.name + ' · ' + scopes.lp.stock + ' in stock', as: 'p' })" },
  },
  {
    key: "low-empty",
    component: "Callout",
    hidden: "scopes.root.low.items.length > 0",
    props: { literal: { variant: "info", title: "Nothing is low on stock." } },
  },
];

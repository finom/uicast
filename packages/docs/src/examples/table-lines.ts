import type { ComponentEntry } from "uicast";

export const tableLines: ComponentEntry[] = [
  {
    key: "table-card",
    component: "Table",
    seed: [
      { set: "scopes.root.rows", literal: [{ key: 1.0, a: 0.0, b: 0.0 }] },
      { set: "scopes.root.nextId", literal: 2.0 },
      { set: "scopes.root.totalSum", literal: 0.0 },
    ],
    children: ["thead", "tbody", "tfoot"],
  },
  {
    key: "thead",
    component: "TableHeader",
    children: ["header-row"],
  },
  {
    key: "header-row",
    component: "TableRow",
    children: ["th-a", "th-b", "th-sum", "th-actions"],
  },
  {
    key: "th-a",
    component: "TableHead",
    props: { literal: { children: "A" } },
  },
  {
    key: "th-b",
    component: "TableHead",
    props: { literal: { children: "B" } },
  },
  {
    key: "th-sum",
    component: "TableHead",
    props: { literal: { children: "Sum" } },
  },
  {
    key: "th-actions",
    component: "TableHead",
    props: { literal: { children: "Actions" } },
  },
  {
    key: "tbody",
    component: "TableBody",
    children: ["data-rows"],
  },
  {
    key: "data-rows",
    component: "TableRow",
    keyBy: "id",
    each: "scopes.root.rows",
    as: "row",
    children: ["td-input-a", "td-input-b", "td-sum", "td-delete"],
  },
  {
    key: "td-input-a",
    component: "TableCell",
    children: ["input-a"],
  },
  {
    key: "input-a",
    component: "NumberInput",
    props: { expr: "({value: scopes.row.item.a})" },
    callbacks: {
      onChange: [
        { set: "scopes.row.item.a", expr: "evt.value" },
        {
          set: "scopes.root.totalSum",
          expr: "scopes.root.childScopes.row.reduce((acc, r) => acc + r.item.a + r.item.b, 0)",
        },
      ],
    },
  },
  {
    key: "td-input-b",
    component: "TableCell",
    children: ["input-b"],
  },
  {
    key: "input-b",
    component: "NumberInput",
    props: { expr: "({value: scopes.row.item.b})" },
    callbacks: {
      onChange: [
        { set: "scopes.row.item.b", expr: "evt.value" },
        {
          set: "scopes.root.totalSum",
          expr: "scopes.root.childScopes.row.reduce((acc, r) => acc + r.item.a + r.item.b, 0)",
        },
      ],
    },
  },
  {
    key: "td-sum",
    component: "TableCell",
    children: ["sum-text"],
  },
  {
    key: "sum-text",
    component: "Text",
    props: {
      expr: "({children: scopes.row.item.a + scopes.row.item.b})",
    },
  },
  {
    key: "td-delete",
    component: "TableCell",
    children: ["delete-btn"],
  },
  {
    key: "delete-btn",
    component: "Button",
    props: {
      literal: { children: "Delete", variant: "destructive", size: "sm" },
    },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.rows",
          expr: "scopes.root.rows.filter(r => r.id !== scopes.row.item.id)",
          confirm: "Are you sure you want to delete this row?",
        },
        {
          set: "scopes.root.totalSum",
          expr: "scopes.root.childScopes.row.reduce((acc, r) => acc + r.item.a + r.item.b, 0)",
        },
      ],
    },
  },
  {
    key: "tfoot",
    component: "TableFooter",
    children: ["footer-row"],
  },
  {
    key: "footer-row",
    component: "TableRow",
    children: ["td-total-label", "td-add-btn", "td-total-sum", "td-row-count"],
  },
  {
    key: "td-total-label",
    component: "TableCell",
    props: { literal: { children: "Total" } },
  },
  {
    key: "td-add-btn",
    component: "TableCell",
    children: ["add-btn"],
  },
  {
    key: "add-btn",
    component: "Button",
    props: {
      literal: { children: "+ Add Row", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.rows",
          expr: "[...currentValue, { key: scopes.root.nextId, a: 0, b: 0 }]",
        },
        { set: "scopes.root.nextId", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "td-total-sum",
    component: "TableCell",
    children: ["total-sum-text"],
  },
  {
    key: "total-sum-text",
    component: "Text",
    props: { expr: "({children: scopes.root.totalSum})" },
  },
  {
    key: "td-row-count",
    component: "TableCell",
    children: ["row-count-text"],
  },
  {
    key: "row-count-text",
    seed: [
      {
        set: "scopes.root.foo",
        expr: "UserApi_getUsers().then(u => u.length)",
      },
    ],
    component: "Text",
    props: {
      expr: '({children: scopes.root.rows.length + " rows " + scopes.root.foo })',
    },
  },
] as const;

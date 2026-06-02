import { ChunkComponent } from "ui-fired/core/types";

export const tableLines: ChunkComponent[] = [
  {
    key: "table-card",
    component: "Table",
    op: "root",
    kind: "element",
    defaults: [
      { set: "scopes.root.rows", literal: [{ key: 1.0, a: 0.0, b: 0.0 }] },
      { set: "scopes.root.nextId", literal: 2.0 },
      { set: "scopes.root.totalSum", literal: 0.0 },
    ],
    children: ["thead", "tbody", "tfoot"],
  },
  {
    key: "thead",
    component: "TableHeader",
    op: "child",
    kind: "element",
    children: ["header-row"],
  },
  {
    key: "header-row",
    component: "TableRow",
    op: "child",
    kind: "element",
    children: ["th-a", "th-b", "th-sum", "th-actions"],
  },
  {
    key: "th-a",
    component: "TableHead",
    op: "child",
    kind: "element",
    props: { literal: { children: "A" } },
  },
  {
    key: "th-b",
    component: "TableHead",
    op: "child",
    kind: "element",
    props: { literal: { children: "B" } },
  },
  {
    key: "th-sum",
    component: "TableHead",
    op: "child",
    kind: "element",
    props: { literal: { children: "Sum" } },
  },
  {
    key: "th-actions",
    component: "TableHead",
    op: "child",
    kind: "element",
    props: { literal: { children: "Actions" } },
  },
  {
    key: "tbody",
    component: "TableBody",
    op: "child",
    kind: "element",
    children: ["data-rows"],
  },
  {
    key: "data-rows",
    component: "TableRow",
    op: "child",
    kind: "list",
    itemIdKey: "id",
    itemsSource: "scopes.root.rows",
    itemScope: "row",
    children: ["td-input-a", "td-input-b", "td-sum", "td-delete"],
  },
  {
    key: "td-input-a",
    component: "TableCell",
    op: "child",
    kind: "element",
    children: ["input-a"],
  },
  {
    key: "input-a",
    component: "NumberInput",
    op: "child",
    kind: "element",
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
    op: "child",
    kind: "element",
    children: ["input-b"],
  },
  {
    key: "input-b",
    component: "NumberInput",
    op: "child",
    kind: "element",
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
    op: "child",
    kind: "element",
    children: ["sum-text"],
  },
  {
    key: "sum-text",
    component: "Text",
    op: "child",
    kind: "element",
    props: {
      expr: "({children: scopes.row.item.a + scopes.row.item.b})",
    },
  },
  {
    key: "td-delete",
    component: "TableCell",
    op: "child",
    kind: "element",
    children: ["delete-btn"],
  },
  {
    key: "delete-btn",
    component: "Button",
    op: "child",
    kind: "element",
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
    op: "child",
    kind: "element",
    children: ["footer-row"],
  },
  {
    key: "footer-row",
    component: "TableRow",
    op: "child",
    kind: "element",
    children: ["td-total-label", "td-add-btn", "td-total-sum", "td-row-count"],
  },
  {
    key: "td-total-label",
    component: "TableCell",
    op: "child",
    kind: "element",
    props: { literal: { children: "Total" } },
  },
  {
    key: "td-add-btn",
    component: "TableCell",
    op: "child",
    kind: "element",
    children: ["add-btn"],
  },
  {
    key: "add-btn",
    component: "Button",
    op: "child",
    kind: "element",
    props: {
      literal: { children: "+ Add Row", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.rows",
          expr: "[...scopes.root.rows, { key: scopes.root.nextId, a: 0, b: 0 }]",
        },
        { set: "scopes.root.nextId", expr: "scopes.root.nextId + 1" },
      ],
    },
  },
  {
    key: "td-total-sum",
    component: "TableCell",
    op: "child",
    kind: "element",
    children: ["total-sum-text"],
  },
  {
    key: "total-sum-text",
    component: "Text",
    op: "child",
    kind: "element",
    props: { expr: "({children: scopes.root.totalSum})" },
  },
  {
    key: "td-row-count",
    component: "TableCell",
    op: "child",
    kind: "element",
    children: ["row-count-text"],
  },
  {
    key: "row-count-text",
    defaults: [
      {
        set: "scopes.root.foo",
        expr: "UserRPC_getUsers().then(u => u.length)",
      },
    ],
    component: "Text",
    op: "child",
    kind: "element",
    props: {
      expr: '({children: scopes.root.rows.length + " rows " + scopes.root.foo })',
    },
  },
] as const;

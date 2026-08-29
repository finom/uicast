import type { ComponentEntry } from "@uicast/core";

export const asyncLines: ComponentEntry[] = [
  {
    key: "users-table",
    component: "Table",
    seed: [
      {
        set: "scopes.root.users",
        expr: "UserApi_getUsers()",
      },
    ],
    children: ["users-thead", "users-tbody"],
  },
  {
    key: "users-thead",
    component: "TableHeader",
    children: ["users-header-row"],
  },
  {
    key: "users-header-row",
    component: "TableRow",
    children: ["th-name", "th-email"],
  },
  {
    key: "th-name",
    component: "TableHead",
    props: { literal: { text: "Name" } },
  },
  {
    key: "th-email",
    component: "TableHead",
    props: { literal: { text: "Email" } },
  },
  {
    key: "users-tbody",
    component: "TableBody",
    children: ["user-rows"],
  },
  {
    key: "user-rows",
    component: "TableRow",
    keyBy: "id",
    each: "scopes.root.users",
    as: "user",
    children: ["td-name", "td-email"],
  },
  {
    key: "td-name",
    component: "TableCell",
    children: ["name-text"],
  },
  {
    key: "name-text",
    component: "Text",
    props: { expr: "({text: scopes.user.item.fullName})" },
  },
  {
    key: "td-email",
    component: "TableCell",
    children: ["email-text"],
  },
  {
    key: "email-text",
    component: "Text",
    props: { expr: "({text: scopes.user.item.email})" },
  },
] as const;

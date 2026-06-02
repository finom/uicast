import { ChunkComponent } from "@ui-fired/core/types";

export const chartLines: ChunkComponent[] = [
  {
    key: "chart-root",
    component: "FlexCol",
    props: { literal: { gap: "4" } },
    defaults: [
      { set: "scopes.root.tasks", expr: "TaskRPC_getTasks()" },
      { set: "scopes.root.users", expr: "UserRPC_getUsers()" },
      {
        set: "scopes.root.barChartData",
        expr: '[{status: "TODO", count: String(scopes.root.tasks.filter(t => t.status === "TODO").length)}, {status: "In Progress", count: String(scopes.root.tasks.filter(t => t.status === "IN_PROGRESS").length)}, {status: "Done", count: String(scopes.root.tasks.filter(t => t.status === "DONE").length)}]',
      },
      {
        set: "scopes.root.pieChartData",
        expr: "scopes.root.users.map(u => ({name: u.fullName, value: scopes.root.tasks.filter(t => t.userId === u.id).length}))",
      },
    ],
    children: ["bar-card", "pie-card"],
  },
  {
    key: "bar-card",
    component: "Card",
    props: { literal: { title: "Tasks by Status" } },
    children: ["status-bar-chart"],
  },
  {
    key: "status-bar-chart",
    component: "BarChart",
    props: {
      expr: '({data: scopes.root.barChartData, xKey: "status", yKeys: ["count"], height: 300})',
    },
  },
  {
    key: "pie-card",
    component: "Card",
    props: { literal: { title: "Tasks per User" } },
    defaults: [
      {
        set: "scopes.root.pieChartData",
        expr: "scopes.root.users.map(u => ({name: u.fullName, value: scopes.root.tasks.filter(t => t.userId === u.id).length}))",
      },
    ],
    children: ["user-pie-chart"],
  },
  {
    key: "user-pie-chart",
    component: "PieChart",
    props: {
      expr: "({data: scopes.root.pieChartData, height: 300, donut: true})",
    },
  },
] as const;

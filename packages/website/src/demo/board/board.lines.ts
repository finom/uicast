import type { ComponentEntry } from "@ui-fired/core/types";

/**
 * The flow-board artifact. One `scopes.root.*` namespace holds the nodes and
 * the links between them. NodeBoard is a single bespoke component that emits TWO
 * differently-shaped events — a spatial { id, x, y } on drag and a relational
 * { from, to } on connect — both wired declaratively into the same scope; every
 * callback also records itself in `scopes.root.lastEvt` so the "Last event"
 * panel shows the payload shape change between a drag and a connect.
 */
export const boardLines: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    defaults: [
      {
        set: "scopes.root.nodes",
        literal: [
          { id: "a", label: "Idea", x: 0.18, y: 0.28 },
          { id: "b", label: "Research", x: 0.5, y: 0.18 },
          { id: "c", label: "Draft", x: 0.78, y: 0.4 },
          { id: "d", label: "Review", x: 0.4, y: 0.72 },
          { id: "e", label: "Ship", x: 0.74, y: 0.78 },
        ],
      },
      {
        set: "scopes.root.links",
        literal: [
          { from: "a", to: "b" },
          { from: "b", to: "c" },
          { from: "c", to: "e" },
        ],
      },
      { set: "scopes.root.lastEvt", literal: null },
    ],
    children: ["intro", "board-card", "controls", "readout-row"],
  },

  // Intro
  {
    key: "intro",
    component: "FlexCol",
    props: { literal: { gap: "1" } },
    children: ["title", "subtitle"],
  },
  {
    key: "title",
    component: "Heading",
    props: { literal: { level: "2", children: "Flow board" } },
  },
  {
    key: "subtitle",
    component: "Text",
    props: {
      literal: {
        children:
          "One bespoke component, two custom event shapes: dragging a node emits a spatial { id, x, y }, wiring two nodes emits a relational { from, to } — both flowing through the same declarative callback mechanism.",
        variant: "muted",
      },
    },
  },

  // The board itself
  {
    key: "board-card",
    component: "Card",
    props: {
      literal: {
        title: "Board",
        description: "Drag a node to move it; click two ports to wire them.",
      },
    },
    children: ["board"],
  },
  {
    key: "board",
    component: "NodeBoard",
    props: {
      expr: "({ nodes: scopes.root.nodes, links: scopes.root.links })",
    },
    callbacks: {
      onMoveNode: [
        {
          set: "scopes.root.nodes",
          expr: "scopes.root.nodes.map(n => n.id === evt.id ? ({ id: n.id, label: n.label, x: evt.x, y: evt.y }) : n)",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'NodeBoard.onMoveNode', payload: evt })",
        },
      ],
      onConnect: [
        {
          set: "scopes.root.links",
          expr: "scopes.root.links.concat([{ from: evt.from, to: evt.to }])",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'NodeBoard.onConnect', payload: evt })",
        },
      ],
    },
  },

  // Controls: a host-function call + a confirm-gated clear
  {
    key: "controls",
    component: "FlexRow",
    props: { literal: { gap: "2" } },
    children: ["auto-btn", "clear-btn"],
  },
  {
    key: "auto-btn",
    component: "Button",
    props: { literal: { children: "Auto-arrange", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.nodes",
          expr: "await autoLayout({ nodes: scopes.root.nodes })",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'auto-arrange' } })",
        },
      ],
    },
  },
  {
    key: "clear-btn",
    component: "Button",
    props: { literal: { children: "Clear links", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.links",
          literal: [],
          confirm: "Remove every connection on the board?",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'clear-links' } })",
        },
      ],
    },
  },

  // Readouts: derived graph stat + the live "Last event" panel
  {
    key: "readout-row",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["graph-stat", "evt-card"],
  },
  {
    key: "graph-stat",
    component: "Stat",
    props: {
      expr: "({ label: 'Graph', value: scopes.root.nodes.length + ' nodes', helpText: scopes.root.links.length + ' connections' })",
    },
  },
  {
    key: "evt-card",
    component: "Card",
    props: { literal: { title: "Last event" } },
    children: ["evt-text"],
  },
  {
    key: "evt-text",
    component: "Text",
    props: {
      expr: "({ children: scopes.root.lastEvt ? JSON.stringify(scopes.root.lastEvt) : 'Drag a node or wire two together to see its event payload…', variant: 'muted' })",
    },
  },
];

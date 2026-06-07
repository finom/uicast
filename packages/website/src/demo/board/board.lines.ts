import type { Fired } from "@ui-fired/core/types";

/**
 * The flow-board artifact. One `scopes.board.*` namespace holds the nodes and
 * the links between them. NodeBoard is a single bespoke component that emits TWO
 * differently-shaped events — a spatial { id, x, y } on drag and a relational
 * { from, to } on connect — both wired declaratively into the same scope; every
 * callback also records itself in `scopes.board.lastEvt` so the "Last event"
 * panel shows the payload shape change between a drag and a connect.
 */
export const boardLines: Fired.Element[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    defaults: [
      {
        set: "scopes.board.nodes",
        literal: [
          { id: "a", label: "Idea", x: 0.18, y: 0.28 },
          { id: "b", label: "Research", x: 0.5, y: 0.18 },
          { id: "c", label: "Draft", x: 0.78, y: 0.4 },
          { id: "d", label: "Review", x: 0.4, y: 0.72 },
          { id: "e", label: "Ship", x: 0.74, y: 0.78 },
        ],
      },
      {
        set: "scopes.board.links",
        literal: [
          { from: "a", to: "b" },
          { from: "b", to: "c" },
          { from: "c", to: "e" },
        ],
      },
      { set: "scopes.board.lastEvt", literal: null },
    ],
    children: ["intro", "boardCard", "controls", "readoutRow"],
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
    key: "boardCard",
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
      expr: "({ nodes: scopes.board.nodes, links: scopes.board.links })",
    },
    callbacks: {
      onMoveNode: [
        {
          set: "scopes.board.nodes",
          expr: "scopes.board.nodes.map(n => n.id === evt.id ? ({ id: n.id, label: n.label, x: evt.x, y: evt.y }) : n)",
        },
        {
          set: "scopes.board.lastEvt",
          expr: "({ event: 'NodeBoard.onMoveNode', payload: evt })",
        },
      ],
      onConnect: [
        {
          set: "scopes.board.links",
          expr: "scopes.board.links.concat([{ from: evt.from, to: evt.to }])",
        },
        {
          set: "scopes.board.lastEvt",
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
    children: ["autoBtn", "clearBtn"],
  },
  {
    key: "autoBtn",
    component: "Button",
    props: { literal: { children: "Auto-arrange", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.board.nodes",
          expr: "await autoLayout({ nodes: scopes.board.nodes })",
        },
        {
          set: "scopes.board.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'auto-arrange' } })",
        },
      ],
    },
  },
  {
    key: "clearBtn",
    component: "Button",
    props: { literal: { children: "Clear links", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.board.links",
          literal: [],
          confirm: "Remove every connection on the board?",
        },
        {
          set: "scopes.board.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'clear-links' } })",
        },
      ],
    },
  },

  // Readouts: derived graph stat + the live "Last event" panel
  {
    key: "readoutRow",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["graphStat", "evtCard"],
  },
  {
    key: "graphStat",
    component: "Stat",
    props: {
      expr: "({ label: 'Graph', value: scopes.board.nodes.length + ' nodes', helpText: scopes.board.links.length + ' connections' })",
    },
  },
  {
    key: "evtCard",
    component: "Card",
    props: { literal: { title: "Last event" } },
    children: ["evtText"],
  },
  {
    key: "evtText",
    component: "Text",
    props: {
      expr: "({ children: scopes.board.lastEvt ? JSON.stringify(scopes.board.lastEvt) : 'Drag a node or wire two together to see its event payload…', variant: 'muted' })",
    },
  },
];

import type { ComponentEntry } from "@uicast/core";

// Every callback also records itself in `scopes.root.lastEvt`, which the "Last event" card prints.
export const studioLines: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.x", literal: 0.5 },
      { set: "scopes.root.y", literal: 0.4 },
      { set: "scopes.root.cutoff", literal: 62 },
      { set: "scopes.root.resonance", literal: 28 },
      { set: "scopes.root.drive", literal: 45 },
      {
        set: "scopes.root.pattern",
        literal: [
          [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        ],
      },
      { set: "scopes.root.lastEvt", literal: null },
    ],
    children: ["intro", "top-row", "seq-card", "controls", "readout-row"],
  },

  {
    key: "intro",
    component: "FlexCol",
    props: { literal: { gap: "1" } },
    children: ["title", "subtitle"],
  },
  {
    key: "title",
    component: "Heading",
    props: { literal: { level: "2", text: "Groovebox" } },
  },
  {
    key: "subtitle",
    component: "Typography",
    props: {
      literal: {
        text:
          "Every pad, knob, and step below is a bespoke component emitting its own custom event payload — all wired declaratively into one reactive scope.",
        variant: "muted",
      },
    },
  },

  {
    key: "top-row",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["xy-card", "knob-card"],
  },
  {
    key: "xy-card",
    component: "Card",
    props: { literal: { title: "Filter — XY pad" } },
    children: ["xy"],
  },
  {
    key: "xy",
    component: "XYPad",
    props: {
      expr: "({ x: scopes.root.x, y: scopes.root.y, xLabel: 'Cutoff →', yLabel: 'Resonance ↑' })",
    },
    callbacks: {
      onMove: [
        { set: "scopes.root.x", expr: "evt.x" },
        { set: "scopes.root.y", expr: "evt.y" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'XYPad.onMove', payload: evt })",
        },
      ],
    },
  },
  {
    key: "knob-card",
    component: "Card",
    props: { literal: { title: "Voice" } },
    children: ["knob-row"],
  },
  {
    key: "knob-row",
    component: "FlexRow",
    props: { literal: { gap: "4", justify: "around", align: "center" } },
    children: ["knob-cutoff", "knob-res", "knob-drive"],
  },
  {
    key: "knob-cutoff",
    component: "Knob",
    props: { expr: "({ value: scopes.root.cutoff, label: 'Cutoff' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.root.cutoff", expr: "evt.value" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Knob.onTurn (cutoff)', payload: evt })",
        },
      ],
    },
  },
  {
    key: "knob-res",
    component: "Knob",
    props: { expr: "({ value: scopes.root.resonance, label: 'Reso' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.root.resonance", expr: "evt.value" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Knob.onTurn (resonance)', payload: evt })",
        },
      ],
    },
  },
  {
    key: "knob-drive",
    component: "Knob",
    props: { expr: "({ value: scopes.root.drive, label: 'Drive' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.root.drive", expr: "evt.value" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Knob.onTurn (drive)', payload: evt })",
        },
      ],
    },
  },

  {
    key: "seq-card",
    component: "Card",
    props: { literal: { title: "Pattern — step sequencer" } },
    children: ["seq"],
  },
  {
    key: "seq",
    component: "StepSequencer",
    props: {
      expr: "({ tracks: [{ id: 'kick', label: 'Kick' }, { id: 'snare', label: 'Snare' }, { id: 'hat', label: 'Hat' }], steps: 16, pattern: scopes.root.pattern, playhead: -1 })",
    },
    callbacks: {
      onToggle: [
        {
          set: "scopes.root.pattern",
          expr: "scopes.root.pattern.map((row, ti) => ti === evt.trackIndex ? row.map((c, si) => si === evt.step ? evt.on : c) : row)",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'StepSequencer.onToggle', payload: evt })",
        },
      ],
    },
  },

  {
    key: "controls",
    component: "FlexRow",
    props: { literal: { gap: "2" } },
    children: ["randomize-btn", "clear-btn"],
  },
  {
    key: "randomize-btn",
    component: "Button",
    props: { literal: { text: "Randomize pattern", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.pattern",
          expr: "randomizePattern({ tracks: 3, steps: 16 })",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'randomize' } })",
        },
      ],
    },
  },
  {
    key: "clear-btn",
    component: "Button",
    props: { literal: { text: "Clear", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.pattern",
          expr: "scopes.root.pattern.map(row => row.map(() => false))",
          confirm: "Clear the whole pattern?",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'clear' } })",
        },
      ],
    },
  },

  {
    key: "readout-row",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["filter-stat", "evt-card"],
  },
  {
    key: "filter-stat",
    component: "Stat",
    props: {
      expr: "({ label: 'Filter', value: Math.round(80 + scopes.root.x * 7920) + ' Hz', helpText: 'Q ' + scopes.root.y.toFixed(2) + ' · drive ' + scopes.root.drive + '%' })",
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
    component: "Typography",
    props: {
      expr: "({ text: scopes.root.lastEvt ? JSON.stringify(scopes.root.lastEvt) : 'Interact with a control to see its event payload…', variant: 'muted' })",
    },
  },
];

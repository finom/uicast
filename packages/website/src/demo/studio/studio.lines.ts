import type { Fired } from "@ui-fired/core/types";

/**
 * The groovebox artifact — the JSONLines a model would stream to build the synth
 * demo, hand-authored as a typed `Fired.Element[]`. Everything reactive lives in
 * one `scopes.synth.*` namespace; every bespoke component's callback writes the
 * event payload to `scopes.synth.lastEvt` (alongside its real effect) so the
 * "Last event" panel can show each payload shape verbatim.
 */
export const studioLines: Fired.Element[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    defaults: [
      { set: "scopes.synth.x", literal: 0.5 },
      { set: "scopes.synth.y", literal: 0.4 },
      { set: "scopes.synth.cutoff", literal: 62 },
      { set: "scopes.synth.resonance", literal: 28 },
      { set: "scopes.synth.drive", literal: 45 },
      {
        set: "scopes.synth.pattern",
        literal: [
          [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        ],
      },
      { set: "scopes.synth.lastEvt", literal: null },
    ],
    children: ["intro", "topRow", "seqCard", "controls", "readoutRow"],
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
    props: { literal: { level: "2", children: "Groovebox" } },
  },
  {
    key: "subtitle",
    component: "Text",
    props: {
      literal: {
        children:
          "Every pad, knob, and step below is a bespoke component emitting its own custom event payload — all wired declaratively into one reactive scope.",
        variant: "muted",
      },
    },
  },

  // Top row: XY pad + knobs
  {
    key: "topRow",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["xyCard", "knobCard"],
  },
  {
    key: "xyCard",
    component: "Card",
    props: { literal: { title: "Filter — XY pad" } },
    children: ["xy"],
  },
  {
    key: "xy",
    component: "XYPad",
    props: {
      expr: "({ x: scopes.synth.x, y: scopes.synth.y, xLabel: 'Cutoff →', yLabel: 'Resonance ↑' })",
    },
    callbacks: {
      onMove: [
        { set: "scopes.synth.x", expr: "evt.x" },
        { set: "scopes.synth.y", expr: "evt.y" },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'XYPad.onMove', payload: evt })",
        },
      ],
    },
  },
  {
    key: "knobCard",
    component: "Card",
    props: { literal: { title: "Voice" } },
    children: ["knobRow"],
  },
  {
    key: "knobRow",
    component: "FlexRow",
    props: { literal: { gap: "4", justify: "around", align: "center" } },
    children: ["knobCutoff", "knobRes", "knobDrive"],
  },
  {
    key: "knobCutoff",
    component: "Knob",
    props: { expr: "({ value: scopes.synth.cutoff, label: 'Cutoff' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.synth.cutoff", expr: "evt.value" },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'Knob.onTurn (cutoff)', payload: evt })",
        },
      ],
    },
  },
  {
    key: "knobRes",
    component: "Knob",
    props: { expr: "({ value: scopes.synth.resonance, label: 'Reso' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.synth.resonance", expr: "evt.value" },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'Knob.onTurn (resonance)', payload: evt })",
        },
      ],
    },
  },
  {
    key: "knobDrive",
    component: "Knob",
    props: { expr: "({ value: scopes.synth.drive, label: 'Drive' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.synth.drive", expr: "evt.value" },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'Knob.onTurn (drive)', payload: evt })",
        },
      ],
    },
  },

  // Step sequencer
  {
    key: "seqCard",
    component: "Card",
    props: { literal: { title: "Pattern — step sequencer" } },
    children: ["seq"],
  },
  {
    key: "seq",
    component: "StepSequencer",
    props: {
      expr: "({ tracks: [{ id: 'kick', label: 'Kick' }, { id: 'snare', label: 'Snare' }, { id: 'hat', label: 'Hat' }], steps: 16, pattern: scopes.synth.pattern, playhead: -1 })",
    },
    callbacks: {
      onToggle: [
        {
          set: "scopes.synth.pattern",
          expr: "scopes.synth.pattern.map((row, ti) => ti === evt.trackIndex ? row.map((c, si) => si === evt.step ? evt.on : c) : row)",
        },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'StepSequencer.onToggle', payload: evt })",
        },
      ],
    },
  },

  // Controls: a host-function call + a confirm-gated reset
  {
    key: "controls",
    component: "FlexRow",
    props: { literal: { gap: "2" } },
    children: ["randomizeBtn", "clearBtn"],
  },
  {
    key: "randomizeBtn",
    component: "Button",
    props: { literal: { children: "Randomize pattern", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.synth.pattern",
          expr: "await randomizePattern({ tracks: 3, steps: 16 })",
        },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'randomize' } })",
        },
      ],
    },
  },
  {
    key: "clearBtn",
    component: "Button",
    props: { literal: { children: "Clear", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.synth.pattern",
          expr: "scopes.synth.pattern.map(row => row.map(() => false))",
          confirm: "Clear the whole pattern?",
        },
        {
          set: "scopes.synth.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'clear' } })",
        },
      ],
    },
  },

  // Readouts: derived filter state + the live "Last event" panel
  {
    key: "readoutRow",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["filterStat", "evtCard"],
  },
  {
    key: "filterStat",
    component: "Stat",
    props: {
      expr: "({ label: 'Filter', value: Math.round(80 + scopes.synth.x * 7920) + ' Hz', helpText: 'Q ' + scopes.synth.y.toFixed(2) + ' · drive ' + scopes.synth.drive + '%' })",
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
      expr: "({ children: scopes.synth.lastEvt ? JSON.stringify(scopes.synth.lastEvt) : 'Interact with a control to see its event payload…', variant: 'muted' })",
    },
  },
];

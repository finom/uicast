import type { ComponentEntry } from "@uicast/core";

// ColorField and SwatchRail emit the whole color, so one event sets every channel.
// Every callback also records itself in `scopes.root.lastEvt`, which the "Last event" card prints.
export const colorLines: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.h", literal: 220 },
      { set: "scopes.root.s", literal: 80 },
      { set: "scopes.root.l", literal: 55 },
      { set: "scopes.root.hex", literal: "#306ee8" },
      { set: "scopes.root.alpha", literal: 100 },
      {
        set: "scopes.root.swatches",
        literal: ["#306ee8", "#e8a730", "#2bbd8e", "#d4426f", "#7c5cff"],
      },
      { set: "scopes.root.lastEvt", literal: null },
    ],
    children: ["intro", "top-row", "swatch-card", "controls", "readout-row"],
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
    props: { literal: { level: "2", text: "Palette studio" } },
  },
  {
    key: "subtitle",
    component: "Typography",
    props: {
      literal: {
        text:
          "Bespoke color components emit a structured { hex, h, s, l } payload — one event carrying several channels — straight into a reactive scope.",
        variant: "muted",
      },
    },
  },

  {
    key: "top-row",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["field-card", "preview-card"],
  },
  {
    key: "field-card",
    component: "Card",
    props: { literal: { title: "Pick a color" } },
    children: ["color-field"],
  },
  {
    key: "color-field",
    component: "ColorField",
    props: {
      expr: "({ h: scopes.root.h, s: scopes.root.s, l: scopes.root.l })",
    },
    callbacks: {
      onPick: [
        { set: "scopes.root.hex", expr: "evt.hex" },
        { set: "scopes.root.h", expr: "evt.h" },
        { set: "scopes.root.s", expr: "evt.s" },
        { set: "scopes.root.l", expr: "evt.l" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'ColorField.onPick', payload: evt })",
        },
      ],
    },
  },
  {
    key: "preview-card",
    component: "Card",
    props: { literal: { title: "Preview" } },
    children: ["preview-inner"],
  },
  {
    key: "preview-inner",
    component: "FlexCol",
    props: { literal: { gap: "4", align: "center" } },
    children: ["color-preview", "alpha-knob"],
  },
  {
    key: "color-preview",
    component: "ColorPreview",
    props: {
      expr: "({ hex: scopes.root.hex, alpha: scopes.root.alpha, label: scopes.root.hex + ' · ' + scopes.root.alpha + '%' })",
    },
  },
  {
    key: "alpha-knob",
    component: "Knob",
    props: { expr: "({ value: scopes.root.alpha, label: 'Alpha' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.root.alpha", expr: "evt.value" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Knob.onTurn (alpha)', payload: evt })",
        },
      ],
    },
  },

  {
    key: "swatch-card",
    component: "Card",
    props: { literal: { title: "Swatches" } },
    children: ["swatch-rail"],
  },
  {
    key: "swatch-rail",
    component: "SwatchRail",
    props: {
      expr: "({ swatches: scopes.root.swatches, selected: scopes.root.hex })",
    },
    callbacks: {
      onSelect: [
        { set: "scopes.root.hex", expr: "evt.hex" },
        { set: "scopes.root.h", expr: "evt.h" },
        { set: "scopes.root.s", expr: "evt.s" },
        { set: "scopes.root.l", expr: "evt.l" },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'SwatchRail.onSelect', payload: evt })",
        },
      ],
    },
  },

  {
    key: "controls",
    component: "FlexRow",
    props: { literal: { gap: "2" } },
    children: ["suggest-btn", "add-btn", "reset-btn"],
  },
  {
    key: "suggest-btn",
    component: "Button",
    props: { literal: { text: "Suggest palette", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.swatches",
          expr: "suggestPalette({ hex: scopes.root.hex })",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'suggest' } })",
        },
      ],
    },
  },
  {
    key: "add-btn",
    component: "Button",
    props: { literal: { text: "Add current", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.swatches",
          expr: "[...scopes.root.swatches, scopes.root.hex]",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'add', hex: scopes.root.hex } })",
        },
      ],
    },
  },
  {
    key: "reset-btn",
    component: "Button",
    props: { literal: { text: "Reset", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.swatches",
          literal: ["#306ee8", "#e8a730", "#2bbd8e", "#d4426f", "#7c5cff"],
          confirm: "Reset the palette to its starting swatches?",
        },
        {
          set: "scopes.root.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'reset' } })",
        },
      ],
    },
  },

  {
    key: "readout-row",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["css-card", "evt-card"],
  },
  {
    key: "css-card",
    component: "Card",
    props: { literal: { title: "CSS" } },
    children: ["css-text"],
  },
  {
    key: "css-text",
    component: "Typography",
    props: {
      expr: "({ text: scopes.root.hex + '  ·  hsl(' + scopes.root.h + ' ' + scopes.root.s + '% ' + scopes.root.l + '%)  ·  alpha ' + scopes.root.alpha + '%', variant: 'muted' })",
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
      expr: "({ text: scopes.root.lastEvt ? JSON.stringify(scopes.root.lastEvt) : 'Pick a color or a swatch to see its event payload…', variant: 'muted' })",
    },
  },
];

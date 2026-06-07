import type { Fired } from "@ui-fired/core/types";

/**
 * The palette-studio artifact. One `scopes.color.*` namespace holds the current
 * color (hex + h/s/l), alpha, and the saved swatches. ColorField and SwatchRail
 * both emit the *whole* color decomposition, so a single event restores every
 * channel; every callback also records itself in `scopes.color.lastEvt`.
 */
export const colorLines: Fired.Element[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    defaults: [
      { set: "scopes.color.h", literal: 220 },
      { set: "scopes.color.s", literal: 80 },
      { set: "scopes.color.l", literal: 55 },
      { set: "scopes.color.hex", literal: "#306ee8" },
      { set: "scopes.color.alpha", literal: 100 },
      {
        set: "scopes.color.swatches",
        literal: ["#306ee8", "#e8a730", "#2bbd8e", "#d4426f", "#7c5cff"],
      },
      { set: "scopes.color.lastEvt", literal: null },
    ],
    children: ["intro", "topRow", "swatchCard", "controls", "readoutRow"],
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
    props: { literal: { level: "2", children: "Palette studio" } },
  },
  {
    key: "subtitle",
    component: "Text",
    props: {
      literal: {
        children:
          "Bespoke color components emit a structured { hex, h, s, l } payload — one event carrying several channels — straight into a reactive scope.",
        variant: "muted",
      },
    },
  },

  // Top row: color field + preview/alpha
  {
    key: "topRow",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["fieldCard", "previewCard"],
  },
  {
    key: "fieldCard",
    component: "Card",
    props: { literal: { title: "Pick a color" } },
    children: ["colorField"],
  },
  {
    key: "colorField",
    component: "ColorField",
    props: {
      expr: "({ h: scopes.color.h, s: scopes.color.s, l: scopes.color.l })",
    },
    callbacks: {
      onPick: [
        { set: "scopes.color.hex", expr: "evt.hex" },
        { set: "scopes.color.h", expr: "evt.h" },
        { set: "scopes.color.s", expr: "evt.s" },
        { set: "scopes.color.l", expr: "evt.l" },
        {
          set: "scopes.color.lastEvt",
          expr: "({ event: 'ColorField.onPick', payload: evt })",
        },
      ],
    },
  },
  {
    key: "previewCard",
    component: "Card",
    props: { literal: { title: "Preview" } },
    children: ["previewInner"],
  },
  {
    key: "previewInner",
    component: "FlexCol",
    props: { literal: { gap: "4", align: "center" } },
    children: ["colorPreview", "alphaKnob"],
  },
  {
    key: "colorPreview",
    component: "ColorPreview",
    props: {
      expr: "({ hex: scopes.color.hex, alpha: scopes.color.alpha, label: scopes.color.hex + ' · ' + scopes.color.alpha + '%' })",
    },
  },
  {
    key: "alphaKnob",
    component: "Knob",
    props: { expr: "({ value: scopes.color.alpha, label: 'Alpha' })" },
    callbacks: {
      onTurn: [
        { set: "scopes.color.alpha", expr: "evt.value" },
        {
          set: "scopes.color.lastEvt",
          expr: "({ event: 'Knob.onTurn (alpha)', payload: evt })",
        },
      ],
    },
  },

  // Swatches
  {
    key: "swatchCard",
    component: "Card",
    props: { literal: { title: "Swatches" } },
    children: ["swatchRail"],
  },
  {
    key: "swatchRail",
    component: "SwatchRail",
    props: {
      expr: "({ swatches: scopes.color.swatches, selected: scopes.color.hex })",
    },
    callbacks: {
      onSelect: [
        { set: "scopes.color.hex", expr: "evt.hex" },
        { set: "scopes.color.h", expr: "evt.h" },
        { set: "scopes.color.s", expr: "evt.s" },
        { set: "scopes.color.l", expr: "evt.l" },
        {
          set: "scopes.color.lastEvt",
          expr: "({ event: 'SwatchRail.onSelect', payload: evt })",
        },
      ],
    },
  },

  // Controls: host-function call, append, confirm-gated reset
  {
    key: "controls",
    component: "FlexRow",
    props: { literal: { gap: "2" } },
    children: ["suggestBtn", "addBtn", "resetBtn"],
  },
  {
    key: "suggestBtn",
    component: "Button",
    props: { literal: { children: "Suggest palette", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.color.swatches",
          expr: "await suggestPalette({ hex: scopes.color.hex })",
        },
        {
          set: "scopes.color.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'suggest' } })",
        },
      ],
    },
  },
  {
    key: "addBtn",
    component: "Button",
    props: { literal: { children: "Add current", variant: "outline" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.color.swatches",
          expr: "scopes.color.swatches.concat([scopes.color.hex])",
        },
        {
          set: "scopes.color.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'add', hex: scopes.color.hex } })",
        },
      ],
    },
  },
  {
    key: "resetBtn",
    component: "Button",
    props: { literal: { children: "Reset", variant: "ghost" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.color.swatches",
          literal: ["#306ee8", "#e8a730", "#2bbd8e", "#d4426f", "#7c5cff"],
          confirm: "Reset the palette to its starting swatches?",
        },
        {
          set: "scopes.color.lastEvt",
          expr: "({ event: 'Button.onClick', payload: { action: 'reset' } })",
        },
      ],
    },
  },

  // Readouts: derived CSS string + the live "Last event" panel
  {
    key: "readoutRow",
    component: "Grid",
    props: { literal: { columns: "2", gap: "4" } },
    children: ["cssCard", "evtCard"],
  },
  {
    key: "cssCard",
    component: "Card",
    props: { literal: { title: "CSS" } },
    children: ["cssText"],
  },
  {
    key: "cssText",
    component: "Text",
    props: {
      expr: "({ children: scopes.color.hex + '  ·  hsl(' + scopes.color.h + ' ' + scopes.color.s + '% ' + scopes.color.l + '%)  ·  alpha ' + scopes.color.alpha + '%', variant: 'muted' })",
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
      expr: "({ children: scopes.color.lastEvt ? JSON.stringify(scopes.color.lastEvt) : 'Pick a color or a swatch to see its event payload…', variant: 'muted' })",
    },
  },
];

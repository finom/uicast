import type { MetaRecord } from "nextra";

// Builder-first order: after Concepts come the pages a developer writes code
// against (def, impl/renderer, functions, events), then the surfaces (prompt,
// streaming, streamdown, error recovery, demo). The Component Entry Format
// deep dive sits last, as reference depth. streamdown precedes error recovery
// because recovery's chat section assumes the fence model.
const meta: MetaRecord = {
  index: "Introduction",
  "getting-started": "Getting started",
  skill: "Agent skill",
  concepts: "Concepts",
  def: "Component definition",
  react: {
    title: "React",
    items: {
      impl: "Component implementation",
      renderer: "Renderer",
    },
  },
  functions: "Host functions",
  events: "Event handling",
  prompt: "Assembling the prompt",
  streaming: "Streaming",
  streamdown: "Streamdown plugin",
  "error-recovery": "Error recovery",
  "nextjs-demo": "Next.js demo 🔧",
  entry: {
    title: "Component Entry Format",
    items: {
      fields: "Entry fields",
      "value-sources": "Value Sources",
      state: "State & Scopes",
      expressions: "JavaScript Expressions",
      reactivity: "Reactivity & Dependencies",
    },
  },
  api: "API reference",
  roadmap: "Roadmap",
  // External links live in the top bar, not the sidebar: `type: "page"` moves an
  // item out of the sidebar into the navbar, and `href` makes it a plain link.
  "standard-tool": {
    title: "standard-tool",
    type: "page",
    href: "https://standard-tool.js.org/",
  },
  // The interactive demo renders full-bleed under its own layout; keep it out of
  // the docs sidebar (its page files still get picked up by Nextra's page glob).
  demo: { display: "hidden" },
};

export default meta;

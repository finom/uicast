import type { MetaRecord } from "nextra";

// streamdown precedes error recovery: recovery's chat section assumes the fence model.
const meta: MetaRecord = {
  index: "Introduction",
  "getting-started": "Getting started",
  // `type: "page"` puts Demos in the navbar; the /demo/[slug] players render full-bleed on their own.
  demo: { title: "Demos", type: "page" },
  skill: "Agent skill",
  concepts: "Concepts",
  expr: {
    title: "Expressions",
    items: {
      index: "The expression evaluator",
      "custom-expr": "Custom evaluator",
      functions: "Host functions",
    },
  },
  def: "Component definition",
  react: {
    title: "React",
    items: {
      impl: "Component implementation",
      renderer: "Provider & Renderer",
      "reference-catalog": "Reference catalog",
    },
  },
  events: "Event handling",
  prompt: "Assembling the prompt",
  streaming: "Streaming",
  streamdown: "Streamdown plugin",
  "nextjs-demo": "Next.js demo 🔧",
  entry: {
    title: "Component Entry Format",
    items: {
      index: "Overview",
      fields: "Entry fields",
      "value-sources": "Value Sources",
      state: "State & Scopes",
      reactivity: "Reactivity & Dependencies",
    },
  },
  "error-recovery": "Error recovery",
  security: "Security model",
  "api-ref": "API reference",
  roadmap: "Roadmap",
  "standard-tool": {
    title: "standard-tool",
    type: "page",
    href: "https://standard-tool.js.org/",
  },
  warehouse: {
    title: "Live demo",
    type: "page",
    href: "https://warehouse.uicast.dev",
  },
};

export default meta;

import type { MetaRecord } from "nextra";

// streamdown precedes error recovery: recovery's chat section assumes the fence model.
const meta: MetaRecord = {
  index: "Introduction",
  "getting-started": "Getting started",
  skill: "Agent skill",
  concepts: "Concepts",
  expr: {
    title: "Expressions",
    items: {
      index: "The expression evaluator",
      functions: "Host functions",
      "custom-expr": "Custom evaluator",
    },
  },
  def: "Component definition",
  react: {
    title: "React",
    items: {
      index: "Component implementation",
      renderer: "Provider & Renderer",
      "reference-catalog": "Reference catalog",
      ssr: "Server rendering",
    },
  },
  // Linked from the reference catalog page and the catalog README, not from the menus.
  "shadcn-catalog-gallery": { title: "Catalog gallery", display: "hidden" },
  events: "Event handling",
  prompt: "Assembling the prompt",
  streaming: "Streaming",
  streamdown: "Streamdown plugin",
  "example-app": "Example app",
  entry: {
    title: "Component Entry Format",
    items: {
      index: "Entry fields",
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
    title: "Example app",
    type: "page",
    href: "https://warehouse.uicast.dev",
  },
};

export default meta;

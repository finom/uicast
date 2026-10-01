import type { MetaRecord } from "nextra";

// streamdown precedes error recovery: recovery's chat section assumes the fence model.
const meta: MetaRecord = {
  index: { title: "Introduction", theme: { breadcrumb: false } },
  "getting-started": "Getting started",
  skill: "Agent skill",
  concepts: "Concepts",
  expr: {
    title: "Expressions",
    items: {
      index: "The expression evaluator",
      functions: "Host functions",
      recipes: "Recipes",
      "custom-expr": "Custom evaluator",
    },
  },
  def: "Component definition",
  react: {
    title: "React",
    items: {
      index: "Component implementation",
      renderer: "Provider & Renderer",
      ssr: "Server rendering",
      "reference-catalog": "Reference catalog",
      "catalog-gallery": "Catalog Gallery",
    },
  },
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

import type { MetaRecord } from "nextra";

const meta: MetaRecord = {
  index: "Introduction",
  "getting-started": "Getting started",
  concepts: "Concepts",
  def: "Component definition",
  react: {
    title: "React",
    items: {
      impl: "Component implementation",
      renderer: "Renderer",
      streaming: "Streaming",
    },
  },
  core: "Core",
  functions: "Host functions",
  entry: {
    title: "Component Entry Format",
    items: {
      fields: "Entry fields",
      "value-sources": "Value Sources",
      expressions: "JavaScript Expressions",
      reactivity: "Reactivity & Dependencies",
      state: "State & Scopes",
    },
  },
  events: "Event handling",
  streamdown: "Streamdown plugin",
  prompt: "Assembling the prompt",
  "error-recovery": "Error recovery",
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

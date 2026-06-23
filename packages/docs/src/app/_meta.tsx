import type { MetaRecord } from "nextra";

const meta: MetaRecord = {
  index: "Introduction",
  "getting-started": "Getting started",
  concepts: "Concepts",
  // The interactive demo renders full-bleed under its own layout; keep it out of
  // the docs sidebar (its page files still get picked up by Nextra's page glob).
  demo: { display: "hidden" },
};

export default meta;

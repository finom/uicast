// Featured servers: presets that prefill the connect form — never a gate.
// Any Streamable HTTP server still connects through the Custom form; a preset
// only saves the user looking up a URL and how that server authenticates.
//
// Endpoints are from documentation, not contractual: if one moves, the server
// card shows "unreachable" and the Custom form still works. Keep this list
// data-only so adding a preset is a PR touching nothing else.

export type FeaturedAuth =
  /** No credential — connect and go. */
  | "none"
  /** A single secret sent as `Authorization: Bearer …`. */
  | "bearer"
  /** The provider hands the user a personal URL with the credential embedded. */
  | "personal-url";

export type FeaturedStep = {
  text: string;
  /** Optional link rendered at the end of the step. */
  href?: string;
  linkLabel?: string;
};

export type FeaturedServer = {
  /** Prefills the server name (and so the tool prefix: `github_…`). */
  slug: string;
  /** Chip label. */
  label: string;
  /** One line: what connecting this gets you. */
  blurb: string;
  auth: FeaturedAuth;
  /** Fixed endpoint for `none` / `bearer`; absent for `personal-url`. */
  url?: string;
  /** Placeholder for the personal URL input. */
  urlPlaceholder?: string;
  /** Placeholder for the secret input, hinting the expected format. */
  secretPlaceholder?: string;
  steps: FeaturedStep[];
  /** Expectation-setting caveat shown under the form. */
  note?: string;
};

export const FEATURED_SERVERS: FeaturedServer[] = [
  {
    slug: "github",
    label: "GitHub",
    blurb: "Repos, issues, and pull requests for your account.",
    auth: "bearer",
    url: "https://api.githubcopilot.com/mcp/",
    secretPlaceholder: "ghp_…",
    steps: [
      {
        text: "Create a classic personal access token with the `repo` and `read:user` scopes.",
        href: "https://github.com/settings/tokens",
        linkLabel: "github.com/settings/tokens",
      },
      { text: "Copy the ghp_… value (it is shown once) and paste it below." },
      { text: "Revoke the token when you are done experimenting." },
    ],
    note: "GitHub's server declares no output schemas, so results render as raw JSON unless you tell the model which fields to use.",
  },
  {
    slug: "stripe",
    label: "Stripe",
    blurb: "Customers, invoices, and payments — in test mode.",
    auth: "bearer",
    url: "https://mcp.stripe.com",
    secretPlaceholder: "sk_test_…",
    steps: [
      {
        text: "Open your API keys with the dashboard switched to Test mode.",
        href: "https://dashboard.stripe.com/test/apikeys",
        linkLabel: "dashboard.stripe.com/test/apikeys",
      },
      {
        text: "Copy the test secret key (sk_test_…) and paste it below. Never use a live key here.",
      },
    ],
  },
  {
    slug: "deepwiki",
    label: "DeepWiki",
    blurb: "Ask questions about any public GitHub repository.",
    auth: "none",
    url: "https://mcp.deepwiki.com/mcp",
    steps: [{ text: "Nothing to set up — connect and ask." }],
  },
  {
    slug: "mslearn",
    label: "Microsoft Learn",
    blurb: "Search Microsoft and Azure documentation.",
    auth: "none",
    url: "https://learn.microsoft.com/api/mcp",
    steps: [{ text: "Nothing to set up — connect and search." }],
  },
  {
    slug: "huggingface",
    label: "Hugging Face",
    blurb: "Search models, datasets, and papers.",
    auth: "none",
    url: "https://huggingface.co/mcp",
    steps: [{ text: "Nothing to set up — anonymous access works." }],
  },
  {
    slug: "context7",
    label: "Context7",
    blurb: "Up-to-date documentation for popular libraries.",
    auth: "none",
    url: "https://mcp.context7.com/mcp",
    steps: [{ text: "Nothing to set up for casual use." }],
  },
  {
    slug: "posthog",
    label: "PostHog",
    blurb: "Product analytics, insights, and feature flags.",
    auth: "bearer",
    url: "https://mcp.posthog.com/mcp",
    secretPlaceholder: "phx_…",
    steps: [
      {
        text: "Create a personal API key in your PostHog user settings.",
        href: "https://us.posthog.com/settings/user-api-keys",
        linkLabel: "posthog.com › settings › personal API keys",
      },
      { text: "Paste the key below." },
    ],
  },
  {
    slug: "zapier",
    label: "Zapier",
    blurb: "Gmail, Sheets, Slack — thousands of app actions.",
    auth: "personal-url",
    urlPlaceholder: "https://mcp.zapier.com/api/mcp/s/…",
    steps: [
      {
        text: "Create an MCP server on Zapier and pick “Other” as the client.",
        href: "https://mcp.zapier.com",
        linkLabel: "mcp.zapier.com",
      },
      {
        text: "Add tools (e.g. Gmail “Send Email”) and authorize the app when Zapier asks.",
      },
      { text: "Copy the server's Streamable HTTP URL and paste it below." },
    ],
    note: "Your Zapier URL embeds your credential — treat it like a password. Zapier tools declare no output schemas, so they suit actions better than data UIs.",
  },
];

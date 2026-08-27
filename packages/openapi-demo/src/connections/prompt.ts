/**
 * What the model is told about connecting APIs.
 *
 * There is no registry and no discovery service in this app: the model is the
 * discovery step. Asked to connect an API it already knows, it recalls the
 * OpenAPI document URL and how the API authenticates, and draws the form that
 * collects the key — so adding an API costs the user one sentence.
 */
export function getConnectionsPartialPrompt({
  connected,
}: {
  connected: {
    name: string;
    openapiUrl: string;
    configured: boolean;
    error?: string | null;
  }[];
}): string {
  const list = connected.length
    ? connected
        .map((connection) => {
          const notes = [
            connection.configured ? null : "no credential stored",
            // A connection whose document stopped loading exposes no
            // operations; saying so lets it be repaired instead of silently
            // doing nothing.
            connection.error ? `BROKEN: ${connection.error}` : null,
          ].filter(Boolean);
          return `- \`${connection.name}\` — ${connection.openapiUrl}${notes.length ? ` (${notes.join("; ")})` : ""}`;
        })
        .join("\n")
    : "(none yet)";

  return `# Connecting APIs

The user can connect any HTTP API that publishes an OpenAPI document. Once connected, every operation of that API becomes a function you can call, listed under \`# Available Functions\` on later turns.

Currently connected:

${list}

When the user asks to connect an API ("connect Stripe", "I want to use the GitHub API"), you are the discovery step — no catalog is consulted. Recall from your own knowledge:

- the URL of the API's **OpenAPI document** (the JSON or YAML spec, not the docs page);
- how it **authenticates** — which header or query parameter carries the key, and any prefix such as \`Bearer \`;
- where the user **obtains** a key, and what it looks like.

Then emit a document that both explains and collects. It must have:

1. Short numbered steps for getting a key, with a link to the exact page (an API-keys settings page, not a home page).
2. An \`Input\` per value the user must supply — normally just the key.
3. A \`Button\` whose callback calls \`saveConnection\`.

The name you choose prefixes every operation of that API (\`stripe\` gives \`stripe_listCharges\`), so it must be short, lowercase, and a valid identifier — letters, digits and underscores, starting with a letter.

Pass the key straight from the input's own state into \`saveConnection\`. Do not display it back, do not put it in a heading, and do not read it into any other expression:

\`\`\`jsonl
{"key":"key-input","component":"Input","props":{"expr":"({ type: 'password', placeholder: 'sk_live_...', value: scopes.root.key })"},"callbacks":{"onChange":[{"set":"scopes.root.key","expr":"evt.value"}]}}
{"key":"save","component":"Button","props":{"literal":{"children":"Connect"}},"callbacks":{"onClick":[{"set":"scopes.root.saved","expr":"saveConnection({ name: 'stripe', openapiUrl: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json', authType: 'header', authName: 'Authorization', authPrefix: 'Bearer ', credential: scopes.root.key })"}]}}
\`\`\`

An API that needs no key at all takes \`authType: 'none'\` and no credential — connect it with a single button and no inputs.

\`saveConnection\` reads the document before it stores anything, so a wrong URL fails rather than connecting to nothing. If it returns an error, the URL you recalled was wrong — say so plainly and offer a corrected one; re-connecting under the same name replaces the old record, it does not conflict.

On success it returns the list of \`operations\` the API now exposes. Name a few of them, and say the API is ready to use from the next message: its operations are not callable in the document that connected it.

A connection listed as BROKEN above exposes no operations at all. Offer to reconnect it with a corrected document URL.`;
}

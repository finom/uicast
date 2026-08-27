import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ServerRow } from "@/store";

/**
 * The MCP client half — server-side only. Nothing here may run in the browser:
 * a server's credentials live in `ServerRow.headers`, and the whole point of
 * proxying tool calls through this app's own route is that they stay here.
 */

type Connection = { client: Client; url: string; headers: string };

// An MCP client is stateful: `connect()` performs the initialize handshake and
// then holds a long-lived stream. Reconnecting per request would re-handshake
// every time, so connections are cached for the life of the Node process and
// keyed by the server's id.
const globalForMcp = globalThis as unknown as {
  mcpConnections?: Map<number, Promise<Connection>>;
};
if (!globalForMcp.mcpConnections) globalForMcp.mcpConnections = new Map();
const connections = globalForMcp.mcpConnections;

async function open(server: ServerRow): Promise<Connection> {
  const client = new Client(
    { name: "uicast-mcp-demo", version: "0.0.0" },
    { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    // The transport has no `headers` option; static credentials ride here.
    requestInit: { headers: server.headers },
  });
  await client.connect(transport);
  return { client, url: server.url, headers: JSON.stringify(server.headers) };
}

async function connect(server: ServerRow): Promise<Client> {
  const cached = connections.get(server.id);
  if (cached) {
    const connection = await cached.catch(() => null);
    // Editing a server's URL or credentials must not keep talking to the old
    // endpoint with the old key.
    if (
      connection &&
      connection.url === server.url &&
      connection.headers === JSON.stringify(server.headers)
    ) {
      return connection.client;
    }
    connections.delete(server.id);
    await connection?.client.close().catch(() => {});
  }
  const pending = open(server);
  connections.set(server.id, pending);
  // A failed connect must not be cached as the answer forever.
  pending.catch(() => connections.delete(server.id));
  return (await pending).client;
}

/** Drop a cached connection — after an edit or a delete. */
export async function disconnect(serverId: number) {
  const pending = connections.get(serverId);
  connections.delete(serverId);
  const connection = await pending?.catch(() => null);
  await connection?.client.close().catch(() => {});
}

/** Everything the server publishes under `tools/list`. */
export async function listTools(server: ServerRow): Promise<Tool[]> {
  const client = await connect(server);
  const { tools } = await client.listTools();
  return tools;
}

/**
 * Run one tool. Returns the structured result when the server declares an
 * output schema, and otherwise the text content it did send — a document that
 * stores this can still display it, it just can't be authored against.
 */
export async function callTool(
  server: ServerRow,
  name: string,
  args: unknown,
): Promise<unknown> {
  const client = await connect(server);
  const result = (await client.callTool({
    name,
    arguments: (args ?? {}) as Record<string, unknown>,
  })) as CallToolResult;

  const text = result.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // `isError: true` is the server saying the CALL failed, not the protocol —
  // throwing turns it into a classified failure the document can recover from.
  if (result.isError) throw new Error(text || "The tool reported an error.");

  if (result.structuredContent !== undefined) return result.structuredContent;
  // No structured result: hand back the text, and JSON when the text is JSON,
  // which is what a server that predates `structuredContent` sends.
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

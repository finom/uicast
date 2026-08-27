import { McpView } from "./mcp-view";

// The tool list is fetched live from every connected server — a snapshot would
// show tools that may no longer exist.
export const dynamic = "force-dynamic";

export default function McpPage() {
  return <McpView />;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConnectCard } from "./connect-card";
import { getFunctionsPartialPrompt } from "@uicast/core/prompt";
import { Badge } from "@uicast/shadcn-catalog/ui/badge";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@uicast/shadcn-catalog/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@uicast/shadcn-catalog/ui/table";
import { LoaderCircle, Plug, Trash2, TriangleAlert } from "lucide-react";
import { type ToolInfo, useMcpTools } from "@/mcp/use-mcp-tools";

type Server = {
  id: number;
  name: string;
  url: string;
  headers: Record<string, string>;
};

export function McpView() {
  const queryClient = useQueryClient();

  const { data: servers } = useQuery({
    queryKey: ["mcp-servers"],
    queryFn: async (): Promise<Server[]> => {
      const res = await fetch("/api/mcp/servers");
      return res.ok ? res.json() : [];
    },
  });

  // The same hook the renderer uses, so this screen shows exactly the function
  // set a generated document is given — not a parallel description of it.
  const { tools, functions, failures, isLoading: listing } = useMcpTools();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["mcp-servers"] });
    queryClient.invalidateQueries({ queryKey: ["mcp-tools"] });
  };

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/mcp/servers/${id}`, { method: "DELETE" });
    },
    onSuccess: refresh,
  });

  // `tools` and `functions` are the same list twice — the raw MCP metadata and
  // its `StandardToolV0` form — so an index in one indexes the other.
  const indexesByServer = new Map<number, number[]>();
  tools.forEach((tool, index) => {
    const list = indexesByServer.get(tool.serverId) ?? [];
    list.push(index);
    indexesByServer.set(tool.serverId, list);
  });
  const failureByServer = new Map(failures.map((failure) => [failure.serverId, failure]));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <Plug className="size-5 shrink-0 text-muted-foreground" />
        <h1 className="text-lg font-semibold">MCP servers</h1>
        {listing && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Listing tools…
          </span>
        )}
      </header>

      <p className="text-sm text-muted-foreground">
        Every function a generated page or chat can call comes from a server connected here. Each
        MCP tool becomes a <code className="text-xs">StandardToolV0</code>, which is the only kind
        of host function uicast knows about — so connecting a server is the whole integration.
      </p>

      <ConnectCard onConnected={refresh} />

      {servers?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No servers connected yet. Until one is, the model has no functions to call and can only
          generate static UI.
        </p>
      )}

      {servers?.map((server) => {
        const indexes = indexesByServer.get(server.id) ?? [];
        const serverTools = indexes.map((index) => tools[index]);
        const failure = failureByServer.get(server.id);
        return (
          <Card key={server.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {server.name}
                {failure ? (
                  <Badge variant="destructive">unreachable</Badge>
                ) : (
                  <Badge variant="secondary">
                    {serverTools.length} tool{serverTools.length === 1 ? "" : "s"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="font-mono text-xs">{server.url}</CardDescription>
            </CardHeader>
            <CardContent>
              {failure ? (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {failure.error}
                </p>
              ) : serverTools.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This server publishes no tools.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Called as</TableHead>
                        <TableHead>Tool</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Output</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serverTools.map((tool: ToolInfo) => (
                        <TableRow key={tool.callName}>
                          <TableCell className="font-mono text-xs">{tool.callName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {tool.toolName}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tool.description ?? tool.title ?? "—"}
                          </TableCell>
                          <TableCell>
                            {tool.outputSchema ? (
                              <Badge variant="secondary">declared</Badge>
                            ) : (
                              <Badge variant="outline">unknown</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {serverTools.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    What the model reads
                  </summary>
                  {/* Built by the real prompt builder from the real tools, so
                      there is no chance of this screen and the prompt drifting. */}
                  <pre className="mt-2 overflow-x-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
                    {getFunctionsPartialPrompt({
                      functions: indexes.map((index) => functions[index]),
                    })}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                A tool whose output is <strong>unknown</strong> may still be called for its effect —
                it just cannot be read field-by-field, because the server never published a shape.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(server.id)}
                disabled={remove.isPending}
              >
                <Trash2 data-icon="inline-start" />
                Disconnect
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

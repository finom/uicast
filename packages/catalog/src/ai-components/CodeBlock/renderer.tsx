import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { useState } from "react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { Card, CardContent, CardHeader } from "@ui-fired/catalog/components/ui/card";
import { ScrollArea, ScrollBar } from "@ui-fired/catalog/components/ui/scroll-area";
import { Check, Copy } from "lucide-react";
import { CodeBlockDef } from "./def";

export const CodeBlockRenderer = createAIComponentRenderer({
  def: CodeBlockDef,
  renderer: ({
    code,
    language = "plaintext",
    showLineNumbers = false,
    showCopyButton = true,
    onCopy,
    generatedKey,
  }) => {
    const [copied, setCopied] = useState(false);
    const lines = code.split("\n");

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.({});
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Card className="group relative bg-muted" data-key={generatedKey}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {language}
          </span>
          {showCopyButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="p-4">
            <pre className="text-sm font-mono">
              {showLineNumbers ? (
                <table className="border-collapse">
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td className="select-none pr-4 text-right text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="whitespace-pre">{line}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <code>{code}</code>
              )}
            </pre>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    );
  },
});

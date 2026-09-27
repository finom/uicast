import { createComponentImplementation } from "@uicast/react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { Check, Copy } from "lucide-react";
import { useCopy } from "../../lib/use-copy";
import { CodeBlockDef } from "./def";

export const CodeBlockImpl = createComponentImplementation({
  def: CodeBlockDef,
  render: ({ code, language, showLineNumbers, showCopyButton, onCopy }, { entry }) => {
    const { copied, copy } = useCopy();
    const lines = code.split("\n");

    const handleCopy = async () => {
      await copy(code);
      onCopy();
    };

    return (
      <Card className="bg-muted" data-key={entry.key}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
          {showCopyButton && (
            <Button variant="ghost" size="icon" className="size-7" onClick={handleCopy}>
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
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
                        <td className="select-none pr-4 text-right text-muted-foreground">{i + 1}</td>
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

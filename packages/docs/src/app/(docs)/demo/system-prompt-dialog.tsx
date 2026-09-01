"use client";
import { ScrollTextIcon } from "lucide-react";
import { useState } from "react";
import {
  getCommonInstructionsPartialPrompt,
  getComponentsPartialPrompt,
  getFunctionsPartialPrompt,
  getScopePartialPrompt,
} from "@uicast/core/prompt";
import { getExpressionsPartialPrompt } from "@uicast/expr/prompt";
import { Button } from "@uicast/shadcn-catalog/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@uicast/shadcn-catalog/ui/dialog";
import { ScrollArea } from "@uicast/shadcn-catalog/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@uicast/shadcn-catalog/ui/tabs";
import { Streamdown } from "streamdown";
import type { DemoConfig } from "@/demo/types";

/**
 * "System prompt" header button + dialog: the prompt a host would send to the
 * model for this demo, assembled from the same partial builders a real host
 * uses — this demo's catalog defs and host functions included. Built lazily on
 * first open (the builders walk every def schema) and cached for the session.
 */
export function SystemPromptDialog({ demo }: { demo: DemoConfig }) {
  const [prompt, setPrompt] = useState<string>();

  const handleOpenChange = (open: boolean) => {
    if (open && prompt === undefined) {
      setPrompt(
        [
          getCommonInstructionsPartialPrompt(),
          getScopePartialPrompt({ kind: "page" }),
          getComponentsPartialPrompt({
            definitions: demo.catalog.map((impl) => impl.def),
          }),
          getFunctionsPartialPrompt({ functions: demo.functions }),
          getExpressionsPartialPrompt(),
        ].join("\n\n"),
      );
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ScrollTextIcon />
          System prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>System prompt</DialogTitle>
          <DialogDescription>
            What a host would send to the model for this demo — the shared
            partials plus this catalog and these functions.
            {prompt !== undefined &&
              ` ≈${Math.round(prompt.length / 4).toLocaleString("en-US")} tokens.`}
          </DialogDescription>
        </DialogHeader>
        {/* min-w-0: a grid item's min-content width would otherwise let long
            code lines stretch the dialog past its max-width. */}
        <Tabs defaultValue="markdown" className="min-w-0">
          <TabsList>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
          <TabsContent value="markdown">
            <ScrollArea className="h-[60svh] rounded-md border bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!">
              <div className="wrap-break-word p-3 text-[13px] leading-relaxed [&_:not(pre)>code]:break-all [&_:not(pre)>code]:whitespace-pre-wrap [&_code]:text-xs [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_pre]:overflow-x-auto [&_pre]:text-xs">
                <Streamdown>{prompt ?? ""}</Streamdown>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="raw">
            <ScrollArea className="h-[60svh] rounded-md border bg-muted/30 [&_[data-slot=scroll-area-viewport]>div]:block!">
              <div className="whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs">
                {prompt}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

"use client";
import type { ComponentEntry } from "@uicast/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@uicast/shadcn-catalog/ui/dialog";
import { type JsonToken, tokenizeJson } from "@/lib/json-tokens";

// Tuned to read on the dialog's `bg-muted/40` panel in both themes.
const TOKEN_CLASS: Record<JsonToken["kind"], string> = {
  key: "text-sky-700 dark:text-sky-300",
  str: "text-emerald-700 dark:text-emerald-300",
  num: "text-amber-700 dark:text-amber-400",
  bool: "text-violet-700 dark:text-violet-300",
  null: "text-rose-600 dark:text-rose-300",
  punct: "text-foreground/50",
};

export type SelectedEntry = { entry: ComponentEntry; index: number };

export function EntryModal({ selected, onClose }: { selected: SelectedEntry | null; onClose: () => void }) {
  return (
    <Dialog open={selected !== null} onOpenChange={(open) => !open && onClose()}>
      {selected && (
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{selected.entry.key}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              entry {String(selected.index + 1).padStart(2, "0")} · {selected.entry.component}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-muted/40 p-3 font-mono text-xs/relaxed">
            <code>
              {tokenizeJson(JSON.stringify(selected.entry, null, 2)).map((token, i) => (
                <span key={i} className={TOKEN_CLASS[token.kind]}>
                  {token.text}
                </span>
              ))}
            </code>
          </pre>
        </DialogContent>
      )}
    </Dialog>
  );
}

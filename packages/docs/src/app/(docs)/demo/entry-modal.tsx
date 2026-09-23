"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@uicast/shadcn-catalog/ui/dialog";
import type { ComponentEntry } from "@uicast/core";

// Tuned to read on the dialog's `bg-muted/40` panel in both themes.
const TOKEN_CLASS = {
  key: "text-sky-700 dark:text-sky-300",
  str: "text-emerald-700 dark:text-emerald-300",
  num: "text-amber-700 dark:text-amber-400",
  bool: "text-violet-700 dark:text-violet-300",
  null: "text-rose-600 dark:text-rose-300",
  punct: "text-foreground/50",
} as const;

type Token = { text: string; cls: keyof typeof TOKEN_CLASS };

// A key is a string followed by `:`; the embedded expression strings stay single tokens.
function tokenizeJson(json: string): Token[] {
  const out: Token[] = [];
  const re =
    /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let last = 0;
  let m: RegExpExecArray | null = re.exec(json);
  while (m !== null) {
    if (m.index > last)
      out.push({ text: json.slice(last, m.index), cls: "punct" });
    const t = m[0];
    let cls: Token["cls"];
    if (t.startsWith('"'))
      cls = /^\s*:/.test(json.slice(re.lastIndex)) ? "key" : "str";
    else if (t === "true" || t === "false") cls = "bool";
    else if (t === "null") cls = "null";
    else cls = "num";
    out.push({ text: t, cls });
    last = re.lastIndex;
    m = re.exec(json);
  }
  if (last < json.length) out.push({ text: json.slice(last), cls: "punct" });
  return out;
}

export type SelectedEntry = { entry: ComponentEntry; index: number };

export function EntryModal({
  selected,
  onClose,
}: {
  selected: SelectedEntry | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
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
              {tokenizeJson(JSON.stringify(selected.entry, null, 2)).map((t, i) => (
                <span key={i} className={TOKEN_CLASS[t.cls]}>
                  {t.text}
                </span>
              ))}
            </code>
          </pre>
        </DialogContent>
      )}
    </Dialog>
  );
}

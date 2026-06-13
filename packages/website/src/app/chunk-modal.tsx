"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ui-fired/catalog/components/ui/dialog";
import type { ComponentEntry } from "@ui-fired/core/types";

// JSON token → Tailwind color. Tuned to read on the dialog's `bg-muted/40` code
// panel in both light and dark themes.
const TOKEN_CLASS = {
  key: "text-sky-700 dark:text-sky-300",
  str: "text-emerald-700 dark:text-emerald-300",
  num: "text-amber-700 dark:text-amber-400",
  bool: "text-violet-700 dark:text-violet-300",
  null: "text-rose-600 dark:text-rose-300",
  punct: "text-foreground/50",
} as const;

type Token = { text: string; cls: keyof typeof TOKEN_CLASS };

// Minimal JSON tokenizer — enough to colorize a pretty-printed chunk: object
// keys, string / number / boolean / null values, and everything else (braces,
// commas, colons, indentation) as punctuation. A key is a string immediately
// followed by `:`. The embedded `expr` / `set` JavaScript stays a single string
// token (not re-highlighted as JS).
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

/**
 * Inspect one streamed chunk: the raw `ComponentEntry` pretty-printed and
 * syntax-highlighted, in a shadcn `Dialog`. Opened by clicking a line in
 * {@link StreamPanel}; the Dialog provides the overlay, the close button, and
 * close-on-Escape / click-outside.
 */
export function ChunkModal({
  chunk,
  index,
  onClose,
}: {
  chunk: ComponentEntry | null;
  index: number | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={chunk != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {chunk && (
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{chunk.key}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              chunk{" "}
              {index != null ? String(index + 1).padStart(2, "0") : "—"} ·{" "}
              {chunk.component}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 font-mono text-xs leading-relaxed">
            <code>
              {tokenizeJson(JSON.stringify(chunk, null, 2)).map((t, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static per-render token list
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

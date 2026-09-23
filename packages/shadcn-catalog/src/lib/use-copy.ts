import { useState } from "react";

const COPIED_MS = 2000;

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  };
  return { copied, copy };
}

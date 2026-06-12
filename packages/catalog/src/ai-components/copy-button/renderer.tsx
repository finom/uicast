import { createAIComponentRenderer } from "@ui-fired/react";
import { useState } from "react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { Check, Copy } from "lucide-react";
import { CopyButtonDef } from "./def";

export const CopyButtonRenderer = createAIComponentRenderer({
  def: CopyButtonDef,
  renderer: ({
    text,
    label = "Copy",
    variant = "outline",
    size = "sm",
    onCopy,
    generatedKey,
  }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.({ text });
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleCopy}
        data-key={generatedKey}
      >
        {copied ? (
          <>
            <Check className="mr-1 h-3.5 w-3.5 text-green-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1 h-3.5 w-3.5" />
            {label}
          </>
        )}
      </Button>
    );
  },
});

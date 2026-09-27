import { createComponentImplementation } from "@uicast/react";
import { Button } from "../../components/ui/button";
import { Check, Copy } from "lucide-react";
import { useCopy } from "../../lib/use-copy";
import { CopyButtonDef } from "./def";

export const CopyButtonImpl = createComponentImplementation({
  def: CopyButtonDef,
  render: ({ text, label, variant, size, onCopy }, { entry }) => {
    const { copied, copy } = useCopy();

    const handleCopy = async () => {
      await copy(text);
      onCopy({ text });
    };

    return (
      <Button variant={variant} size={size} onClick={handleCopy} data-key={entry.key}>
        {copied ? (
          <>
            <Check className="mr-1 size-3.5 text-success" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1 size-3.5" />
            {label}
          </>
        )}
      </Button>
    );
  },
});

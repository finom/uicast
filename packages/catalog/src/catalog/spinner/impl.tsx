import { createComponentImplementation } from "@ui-fired/react";
import { Loader2 } from "lucide-react";
import { SpinnerDef } from "./def";

export const SpinnerImpl = createComponentImplementation({
  def: SpinnerDef,
  render: ({ size = "md", label, generatedKey }) => {
    const sizeMap: Record<string, string> = {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    };
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        data-key={generatedKey}
      >
        <Loader2
          className={`${sizeMap[size]} animate-spin text-muted-foreground`}
        />
        {label && (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
      </div>
    );
  },
});

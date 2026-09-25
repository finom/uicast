import { createComponentImplementation } from "@uicast/react";
import { Loader2 } from "lucide-react";
import { SpinnerDef } from "./def";

const SIZES = { sm: "size-4", md: "size-6", lg: "size-8", xl: "size-12" };

export const SpinnerImpl = createComponentImplementation({
  def: SpinnerDef,
  render: ({ size, label }, { entry }) => (
    <div className="flex flex-col items-center justify-center gap-2" data-key={entry.key}>
      <Loader2 className={`${SIZES[size]} animate-spin text-muted-foreground`} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  ),
});

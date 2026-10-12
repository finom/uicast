import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { FieldLabelId } from "../field/impl";
import { RatingDef } from "./def";

const SIZES = { sm: "h-4 w-4", default: "h-5 w-5", lg: "h-7 w-7" };

export const RatingImpl = createComponentImplementation({
  def: RatingDef,
  render: ({ value, max, size, disabled, onChange }, { entry }) => (
    <div className="flex items-center gap-1" role="group" aria-labelledby={use(FieldLabelId)} data-key={entry.key}>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(Math.max(value - i, 0), 1); // 4.2 fills the fifth star by a fifth
        return (
          <Button
            type="button"
            key={i}
            variant="ghost"
            size="icon"
            className={cn(
              "size-auto p-0.5 transition-colors",
              disabled ? "cursor-default" : "cursor-pointer hover:text-warning",
            )}
            disabled={disabled}
            aria-label={`${i + 1} of ${max} stars`}
            aria-pressed={i + 1 <= value}
            onClick={() => onChange({ value: i + 1 })}
          >
            <span className="relative flex">
              <Star className={cn(SIZES[size], "fill-none text-muted-foreground")} />
              {fill > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${Math.round(fill * 100)}%` }}
                >
                  <Star className={cn(SIZES[size], "fill-warning text-warning")} />
                </span>
              )}
            </span>
          </Button>
        );
      })}
    </div>
  ),
});

import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Star } from "lucide-react";
import { RatingDef } from "./def";

export const RatingImpl = createComponentImplementation({
  def: RatingDef,
  render: ({
    value,
    max,
    size,
    disabled,
    onChange,
  }, { entry }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-7 w-7",
    };

    return (
      <div className="flex items-center gap-1" data-key={entry.key}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < value;
          return (
            <Button
              key={i}
              variant="ghost"
              size="icon"
              className={cn(
                "size-auto p-0.5 transition-colors",
                disabled
                  ? "cursor-default"
                  : "cursor-pointer hover:text-yellow-400",
              )}
              disabled={disabled}
              onClick={() => onChange({ value: i + 1 })}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground",
                )}
              />
            </Button>
          );
        })}
      </div>
    );
  },
});

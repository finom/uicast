import { createComponentImplementation } from "@ui-fired/react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { pickKeyboardEvent } from "../../events/keyboard";
import { Search, X, Loader2 } from "lucide-react";
import { SearchInputDef } from "./def";

export const SearchInputImpl = createComponentImplementation({
  def: SearchInputDef,
  render: ({
    value,
    placeholder = "Search...",
    disabled = false,
    loading = false,
    onChange,
    onClear,
    onSubmit,
    onKeyDown,
    onKeyUp,
    generatedKey,
  }) => {
    const strValue = String(value ?? "");
    return (
      <div className="relative flex items-center" data-key={generatedKey}>
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          value={strValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.({ value: e.target.value })}
          onKeyDown={(e) => {
            onKeyDown?.(pickKeyboardEvent(e));
            if (e.key === "Enter") onSubmit?.({ value: strValue });
          }}
          onKeyUp={(e) => onKeyUp?.(pickKeyboardEvent(e))}
          className="pl-9 pr-16"
        />
        <div className="absolute right-1 flex items-center gap-1">
          {loading && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {strValue && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onClear?.({})}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
});

import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Input } from "ui-fired/catalog/components/ui/input";
import { Button } from "ui-fired/catalog/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { SearchInputDef } from "./def";

export const SearchInputRenderer = createAIComponentRenderer({
  def: SearchInputDef,
  renderer: ({
    value,
    placeholder = "Search...",
    disabled = false,
    loading = false,
    onChange,
    onClear,
    onSubmit,
    generatedKey,
  }) => {
    const strValue = String(value ?? "");
    return (
      <div className="relative flex items-center" data-key={generatedKey}>
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={strValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.({ value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit?.({ value: strValue });
          }}
          className="pl-9 pr-16"
        />
        <div className="absolute right-1 flex items-center gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {strValue && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onClear?.({})}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
});

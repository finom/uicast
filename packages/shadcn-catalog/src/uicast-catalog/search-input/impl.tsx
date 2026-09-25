import { createComponentImplementation } from "@uicast/react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { pickKeyboardEvent } from "../../events/keyboard";
import { Search, X, Loader2 } from "lucide-react";
import { SearchInputDef } from "./def";

export const SearchInputImpl = createComponentImplementation({
  def: SearchInputDef,
  render: ({ value, placeholder, disabled, loading, onChange, onClear, onSubmit, onKeyDown, onKeyUp }, { entry }) => {
    const strValue = value ?? "";
    return (
      <div className="relative flex items-center" data-key={entry.key}>
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          value={strValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange({ value: e.target.value })}
          onKeyDown={(e) => {
            onKeyDown(pickKeyboardEvent(e));
            if (e.key === "Enter") onSubmit({ value: e.currentTarget.value });
          }}
          onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
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
              onClick={() => onClear()}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
});

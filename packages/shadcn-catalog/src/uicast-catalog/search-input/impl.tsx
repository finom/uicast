import { createComponentImplementation } from "@uicast/react";
import { use } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { pickKeyboardEvent } from "../../events/keyboard";
import { useMirror } from "../../lib/use-mirror";
import { Search, X, Loader2 } from "lucide-react";
import { FieldLabelId } from "../field/impl";
import { SearchInputDef } from "./def";

export const SearchInputImpl = createComponentImplementation({
  def: SearchInputDef,
  render: (
    { value: initialValue, placeholder, disabled, onChange, onClear, onSubmit, onKeyDown, onKeyUp },
    { entry, busy },
  ) => {
    const [value, setValue] = useMirror(initialValue ?? "");
    return (
      <div className="relative flex items-center" data-key={entry.key}>
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          value={value}
          placeholder={placeholder}
          aria-labelledby={use(FieldLabelId)}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            onChange({ value: e.target.value });
          }}
          onKeyDown={(e) => {
            onKeyDown(pickKeyboardEvent(e));
            if (e.key === "Enter") onSubmit({ value: e.currentTarget.value });
          }}
          onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
          className="pl-9 pr-16"
        />
        <div className="absolute right-1 flex items-center gap-1">
          {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          {value && !busy && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Clear search"
              onClick={() => {
                setValue("");
                onClear();
              }}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
});

import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { pickKeyboardEvent } from "../../events/keyboard";
import { X } from "lucide-react";
import { TagInputDef } from "./def";

export const TagInputImpl = createComponentImplementation({
  def: TagInputDef,
  render: ({
    tags,
    placeholder,
    disabled,
    maxTags,
    onAdd,
    onRemove,
    onKeyDown,
    onKeyUp,
  }, { entry }) => {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      if (maxTags && tags.length >= maxTags) return;

      const newTags = [...tags, trimmed];
      onAdd({ tag: trimmed, tags: newTags });
      setInputValue("");
    };

    return (
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2"
        data-key={entry.key}
      >
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="gap-1">
            {tag}
            {!disabled && (
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-muted-foreground/20"
                onClick={() => {
                  const newTags = tags.filter((_, idx) => idx !== i);
                  onRemove({ tag, index: i, tags: newTags });
                }}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled || (maxTags != null && tags.length >= maxTags)}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            onKeyDown(pickKeyboardEvent(e));
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
            if (e.key === "Backspace" && !inputValue && tags.length > 0) {
              const lastTag = tags[tags.length - 1];
              const newTags = tags.slice(0, -1);
              onRemove({
                tag: lastTag,
                index: tags.length - 1,
                tags: newTags,
              });
            }
          }}
          onKeyUp={(e) => onKeyUp(pickKeyboardEvent(e))}
          className="min-w-30 flex-1 border-0 p-0 focus-visible:ring-0"
        />
      </div>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => <div className="flex flex-row items-center gap-2">{children}</div>,
});

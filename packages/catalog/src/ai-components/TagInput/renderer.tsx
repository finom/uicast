import { createAIComponentRenderer } from "@ui-fired/react";
import { useState } from "react";
import { Badge } from "@ui-fired/catalog/components/ui/badge";
import { Input } from "@ui-fired/catalog/components/ui/input";
import { X } from "lucide-react";
import { TagInputDef } from "./def";

export const TagInputRenderer = createAIComponentRenderer({
  def: TagInputDef,
  renderer: ({
    tags = [],
    placeholder = "Add a tag...",
    disabled = false,
    maxTags,
    onAdd,
    onRemove,
    generatedKey,
  }) => {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      if (maxTags && tags.length >= maxTags) return;

      const newTags = [...tags, trimmed];
      onAdd?.({ tag: trimmed, tags: newTags });
      setInputValue("");
    };

    return (
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2"
        data-key={generatedKey}
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
                  onRemove?.({ tag, index: i, tags: newTags });
                }}
              >
                <X className="h-3 w-3" />
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
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
            if (e.key === "Backspace" && !inputValue && tags.length > 0) {
              const lastTag = tags[tags.length - 1];
              const newTags = tags.slice(0, -1);
              onRemove?.({
                tag: lastTag,
                index: tags.length - 1,
                tags: newTags,
              });
            }
          }}
          className="min-w-[120px] flex-1 border-0 p-0 focus-visible:ring-0"
        />
      </div>
    );
  },
});

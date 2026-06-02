"use client";
import { useState } from "react";
import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Checkbox } from "ui-fired/catalog/components/ui/checkbox";
import { Badge } from "ui-fired/catalog/components/ui/badge";
import { Button } from "ui-fired/catalog/components/ui/button";
import { ScrollArea } from "ui-fired/catalog/components/ui/scroll-area";
import { ChevronDown, X } from "lucide-react";
import { MultiSelectDef } from "./def";

export const MultiSelectRenderer = createAIComponentRenderer({
  def: MultiSelectDef,
  renderer: ({
    value = [],
    options = [],
    placeholder,
    disabled = false,
    onChange,
    generatedKey,
  }) => {
    const [open, setOpen] = useState(false);
    const selectedLabels = options.filter((o) => value.includes(o.value));

    const toggle = (optValue: string) => {
      const next = value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue];
      onChange?.({ value: next });
    };

    return (
      <div className="relative" data-key={generatedKey}>
        <Button
          variant="outline"
          disabled={disabled}
          className="flex min-h-9 w-full items-center justify-between gap-1 px-3 py-1 text-sm flex-wrap h-auto"
          onClick={() => setOpen(!open)}
        >
          <span className="flex flex-wrap gap-1 flex-1">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 text-xs"
                >
                  {opt.label}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full hover:bg-foreground/20 p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(opt.value);
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">
                {placeholder ?? "Select..."}
              </span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <ScrollArea className="max-h-[200px] p-1">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={value.includes(opt.value)}
                    onCheckedChange={() => toggle(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    );
  },
});

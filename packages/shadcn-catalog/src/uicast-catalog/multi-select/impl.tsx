import { useRef, useState } from "react";
import { createComponentImplementation } from "@uicast/react";
import { ChevronDown, X } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { MultiSelectDef } from "./def";

export const MultiSelectImpl = createComponentImplementation({
  def: MultiSelectDef,
  render: ({ value, options, placeholder, disabled, onChange }, { entry }) => {
    const [open, setOpen] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const selected = options.filter((option) => value.includes(option.value));

    const toggle = (optionValue: string) => {
      const next = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
      onChange({ value: next });
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-auto min-h-9 w-full justify-between gap-1 px-3 py-1"
            data-key={entry.key}
          >
            <span className="flex flex-1 flex-wrap gap-1">
              {selected.length > 0 ? (
                selected.map((option) => (
                  <Badge key={option.value} variant="secondary" className="gap-1 text-xs">
                    {option.label}
                    {/* A span, not a button: it sits inside the trigger. Keyboard users remove from the list. */}
                    <span
                      className="rounded-full p-0.5 hover:bg-foreground/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(option.value);
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder ?? "Select..."}</span>
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
          onOpenAutoFocus={(e) => {
            // Nothing in the list is tabbable; focusing it hands the arrow keys and Enter to cmdk.
            e.preventDefault();
            listRef.current?.focus();
          }}
        >
          <Command>
            <CommandList ref={listRef}>
              <CommandGroup>
                {options.map((option) => {
                  const checked = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      data-checked={checked}
                      aria-checked={checked}
                      onSelect={() => toggle(option.value)}
                    >
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
});

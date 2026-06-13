import { createComponentImplementation } from "@ui-fired/react";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@ui-fired/catalog/lib/utils";
import { Button } from "@ui-fired/catalog/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui-fired/catalog/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ui-fired/catalog/components/ui/command";
import { ComboboxDef } from "./def";

export const ComboboxImpl = createComponentImplementation({
  def: ComboboxDef,
  render: ({
    value,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    options = [],
    disabled = false,
    emptyMessage = "No results found.",
    onChange,
    generatedKey,
  }) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((o) => o.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
            data-key={generatedKey}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange?.({ value: option.value, label: option.label });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
});

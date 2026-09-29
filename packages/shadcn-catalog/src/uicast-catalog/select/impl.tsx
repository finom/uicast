import { createComponentImplementation } from "@uicast/react";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { RequiredValue } from "../../lib/form";
import { cn } from "../../lib/utils";
import { SelectDef } from "./def";

export const SelectImpl = createComponentImplementation({
  def: SelectDef,
  render: (
    {
      value,
      placeholder = "Select...",
      options,
      disabled,
      required,
      searchable,
      searchPlaceholder,
      emptyMessage,
      onChange,
    },
    { entry },
  ) => {
    const [open, setOpen] = useState(false);

    if (!searchable) {
      return (
        <ShadcnSelect
          value={value}
          disabled={disabled}
          required={required}
          onValueChange={(v) => {
            const option = options.find((o) => o.value === v);
            if (option) onChange(option);
          }}
        >
          <SelectTrigger className="w-full" data-key={entry.key}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </ShadcnSelect>
      );
    }

    const selected = options.find((o) => o.value === value);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            // Looks like the plain Select's trigger.
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground")}
            disabled={disabled}
            data-key={entry.key}
          >
            {selected?.label ?? placeholder}
            <ChevronDown data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
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
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        {required && <RequiredValue value={selected?.value ?? ""} />}
      </Popover>
    );
  },
});

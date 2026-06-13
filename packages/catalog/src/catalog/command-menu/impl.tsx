import { createComponentImplementation } from "@ui-fired/react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@ui-fired/catalog/components/ui/command";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CommandMenuDef } from "./def";

export const CommandMenuImpl = createComponentImplementation({
  def: CommandMenuDef,
  render: ({
    open = false,
    placeholder = "Type a command or search...",
    groups = [],
    onSelect,
    onOpenChange,
    generatedKey,
  }) => {
    const getIcon = (iconName?: string) => {
      if (!iconName) return null;
      const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
        iconName
      ];
      return Icon ? <Icon className="mr-2 h-4 w-4 shrink-0" /> : null;
    };

    return (
      <span data-key={generatedKey}>
        <CommandDialog
          open={open}
          onOpenChange={(v: boolean) => onOpenChange?.({ open: v })}
        >
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {groups.map((group, gi) => (
                <CommandGroup key={gi} heading={group.heading}>
                  {group.items.map((item, ii) => (
                    <CommandItem
                      key={ii}
                      onSelect={() => {
                        onSelect?.({
                          label: item.label,
                          groupHeading: group.heading,
                        });
                      }}
                    >
                      {getIcon(item.icon)}
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </CommandDialog>
      </span>
    );
  },
});

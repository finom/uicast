import { createComponentImplementation } from "@uicast/react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "../../components/ui/command";
import { iconNode } from "../../lib/icon-node";
import { CommandMenuDef } from "./def";

export const CommandMenuImpl = createComponentImplementation({
  def: CommandMenuDef,
  render: ({
    open,
    placeholder,
    groups,
    onSelect,
    onOpenChange,
  }, { entry }) => {
    return (
      <span data-key={entry.key}>
        <CommandDialog
          open={open}
          onOpenChange={(v) => onOpenChange({ open: v })}
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
                        onSelect({
                          label: item.label,
                          groupHeading: group.heading,
                        });
                      }}
                    >
                      {iconNode(item.icon, "mr-2 size-4 shrink-0")}
                      <span>{item.label}</span>
                      {item.shortcut?.length ? (
                        <CommandShortcut>{item.shortcut.join("+")}</CommandShortcut>
                      ) : null}
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

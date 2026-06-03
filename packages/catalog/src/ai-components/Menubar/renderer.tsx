import { createAIComponentRenderer } from "@ui-fired/react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "@ui-fired/catalog/components/ui/menubar";
import { MenubarDef } from "./def";

export const MenubarRenderer = createAIComponentRenderer({
  def: MenubarDef,
  renderer: ({ menus = [], onAction, generatedKey }) => {
    return (
      <Menubar data-key={generatedKey}>
        {menus.map((menu, mi) => (
          <MenubarMenu key={mi}>
            <MenubarTrigger>{menu.label}</MenubarTrigger>
            <MenubarContent>
              {menu.items.map((item, ii) => (
                <span key={ii}>
                  {item.separator && <MenubarSeparator />}
                  <MenubarItem
                    disabled={item.disabled}
                    onClick={() =>
                      onAction?.({
                        menuLabel: menu.label,
                        itemLabel: item.label,
                      })
                    }
                  >
                    {item.label}
                    {item.shortcut && (
                      <MenubarShortcut>{item.shortcut}</MenubarShortcut>
                    )}
                  </MenubarItem>
                </span>
              ))}
            </MenubarContent>
          </MenubarMenu>
        ))}
      </Menubar>
    );
  },
});

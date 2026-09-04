import { createComponentImplementation } from "@uicast/react";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "../../components/ui/menubar";
import { MenubarDef } from "./def";

export const MenubarImpl = createComponentImplementation({
  def: MenubarDef,
  render: ({ menus = [], onAction}, { entry }) => {
    return (
      <Menubar data-key={entry.key}>
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
                      onAction({
                        menuLabel: menu.label,
                        itemLabel: item.label,
                      })
                    }
                  >
                    {item.label}
                    {item.shortcut?.length ? (
                      <MenubarShortcut>{item.shortcut.join("+")}</MenubarShortcut>
                    ) : null}
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

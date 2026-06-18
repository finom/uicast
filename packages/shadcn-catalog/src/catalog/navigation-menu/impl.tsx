import { createComponentImplementation } from "@ui-fired/react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "../../components/ui/navigation-menu";
import { NavigationMenuDef } from "./def";

export const NavigationMenuImpl = createComponentImplementation({
  def: NavigationMenuDef,
  render: ({ items = [], onNavigate, generatedKey }) => {
    return (
      <NavigationMenu data-key={generatedKey}>
        <NavigationMenuList>
          {items.map((item, i) =>
            item.children && item.children.length > 0 ? (
              <NavigationMenuItem key={i}>
                <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
                    {item.children.map((child, ci) => (
                      <li key={ci}>
                        <NavigationMenuLink asChild>
                          <button
                            type="button"
                            className="block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
                            onClick={() =>
                              onNavigate?.({
                                label: child.label,
                                parentLabel: item.label,
                              })
                            }
                          >
                            <div className="text-sm font-medium leading-none">
                              {child.label}
                            </div>
                            {child.description && (
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {child.description}
                              </p>
                            )}
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem key={i}>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  onClick={() => onNavigate?.({ label: item.label })}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ),
          )}
        </NavigationMenuList>
      </NavigationMenu>
    );
  },
});

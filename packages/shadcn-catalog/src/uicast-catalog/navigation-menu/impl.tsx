import { createComponentImplementation } from "@uicast/react";
import type { PointerEvent } from "react";
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

// Click only: Radix also opens on hover, and a click just after the hover-open closed the menu again.
const noHover = {
  onPointerMove: (e: PointerEvent) => e.preventDefault(),
  onPointerLeave: (e: PointerEvent) => e.preventDefault(),
};

export const NavigationMenuImpl = createComponentImplementation({
  def: NavigationMenuDef,
  render: ({ items, onNavigate }, { entry }) => (
    <NavigationMenu data-key={entry.key}>
      <NavigationMenuList>
        {items.map((item, i) =>
          item.children && item.children.length > 0 ? (
            <NavigationMenuItem key={i}>
              <NavigationMenuTrigger {...noHover}>{item.label}</NavigationMenuTrigger>
              <NavigationMenuContent {...noHover}>
                <ul className="w-96">
                  {item.children.map((child, ci) => (
                    <li key={ci}>
                      <NavigationMenuLink asChild>
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => onNavigate({ label: child.label, parentLabel: item.label })}
                        >
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="leading-none font-medium">{child.label}</div>
                            {child.description && (
                              <div className="line-clamp-2 text-muted-foreground">{child.description}</div>
                            )}
                          </div>
                        </button>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={i}>
              {/* A button child: an `<a>` without `href` cannot take keyboard focus. */}
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <button type="button" onClick={() => onNavigate({ label: item.label })}>
                  {item.label}
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  ),
});

import { createComponentImplementation } from "@uicast/react";
import { cn } from "../../lib/utils";
import { SidebarDef } from "./def";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { iconNode } from "../../lib/icon-node";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { PanelSkeleton } from "../../lib/skeletons";

const COLLAPSED_WIDTH = 64;

export const SidebarImpl = createComponentImplementation({
  def: SidebarDef,
  render: ({ sections, collapsed, width, onNavigate, onToggleCollapse }, { entry }) => (
    <TooltipProvider>
      <div
        className="flex h-full flex-col border-r bg-background transition-all duration-200"
        style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
        data-key={entry.key}
      >
        <div className="flex items-center justify-end p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => onToggleCollapse({ collapsed: !collapsed })}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 pb-4">
          {sections.map((section, si) => (
            <div key={si} className="mb-4">
              {section.title && !collapsed && (
                <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </div>
              )}
              {section.items.map((item, ii) => {
                const button = (
                  <Button
                    type="button"
                    key={ii}
                    variant={item.active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      item.active && "font-medium",
                      collapsed && "justify-center px-2",
                    )}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={item.active ? "page" : undefined}
                    onClick={() =>
                      onNavigate({
                        sectionIndex: si,
                        itemIndex: ii,
                        label: item.label,
                      })
                    }
                  >
                    {iconNode(item.icon, "size-4")}
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={ii}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return button;
              })}
            </div>
          ))}
        </ScrollArea>
      </div>
    </TooltipProvider>
  ),
  skeleton: PanelSkeleton,
});

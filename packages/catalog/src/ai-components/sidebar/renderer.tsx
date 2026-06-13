import { createAIComponentRenderer } from "@ui-fired/react";
import { cn } from "@ui-fired/catalog/lib/utils";
import { SidebarDef } from "./def";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { ScrollArea } from "@ui-fired/catalog/components/ui/scroll-area";
import { Badge } from "@ui-fired/catalog/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui-fired/catalog/components/ui/tooltip";

export const SidebarRenderer = createAIComponentRenderer({
  def: SidebarDef,
  renderer: ({
    sections = [],
    collapsed = false,
    width = "256px",
    onNavigate,
    onToggleCollapse,
    generatedKey,
  }) => {
    const getIcon = (iconName?: string) => {
      if (!iconName) return null;
      const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
        iconName
      ];
      return Icon ? <Icon className="h-4 w-4" /> : null;
    };

    return (
      <TooltipProvider delayDuration={0}>
        <div
          className={cn(
            "flex h-full flex-col border-r bg-background transition-all duration-200",
          )}
          style={{ width: collapsed ? "64px" : width }}
          data-key={generatedKey}
        >
          <div className="flex items-center justify-end p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleCollapse?.({ collapsed: !collapsed })}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
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
                      key={ii}
                      variant={item.active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        item.active && "font-medium",
                        collapsed && "justify-center px-2",
                      )}
                      onClick={() =>
                        onNavigate?.({
                          sectionIndex: si,
                          itemIndex: ii,
                          label: item.label,
                        })
                      }
                    >
                      {getIcon(item.icon)}
                      {!collapsed && (
                        <span className="flex-1 text-left">{item.label}</span>
                      )}
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
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
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
    );
  },
});

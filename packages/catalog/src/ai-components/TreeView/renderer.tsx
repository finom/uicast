import { createAIComponentRenderer } from "@ui-fired/react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@ui-fired/catalog/components/ui/collapsible";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TreeViewDef } from "./def";

interface TreeNode {
  label: string;
  icon?: string;
  expanded?: boolean;
  children?: TreeNode[];
}

function TreeNodeComponent({
  node,
  depth,
  path,
  expandedMap,
  toggleExpand,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  path: string[];
  expandedMap: Record<string, boolean>;
  toggleExpand: (key: string) => void;
  onSelect?: (args: { label: string; path: string[] }) => Promise<void>;
  onToggle?: (args: { label: string; expanded: boolean }) => Promise<void>;
}) {
  const key = path.join("/");
  const isExpanded = expandedMap[key] ?? node.expanded ?? false;
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[
      iconName
    ];
    return Icon ? <Icon className="h-4 w-4 shrink-0" /> : null;
  };

  if (!hasChildren) {
    return (
      <div
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect?.({ label: node.label, path })}
      >
        <span className="w-5" />
        {getIcon(node.icon)}
        <span>{node.label}</span>
      </div>
    );
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={(open) => {
        toggleExpand(key);
        onToggle?.({ label: node.label, expanded: open });
      }}
    >
      <div
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect?.({ label: node.label, path })}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        {getIcon(node.icon)}
        <span>{node.label}</span>
      </div>
      <CollapsibleContent>
        {node.children!.map((child, i) => (
          <TreeNodeComponent
            key={i}
            node={child}
            depth={depth + 1}
            path={[...path, child.label]}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export const TreeViewRenderer = createAIComponentRenderer({
  def: TreeViewDef,
  renderer: ({ items = [], onSelect, onToggle, generatedKey }) => {
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

    const toggleExpand = (key: string) => {
      setExpandedMap((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="space-y-0.5" data-key={generatedKey}>
        {items.map((item, i) => (
          <TreeNodeComponent
            key={i}
            node={item as TreeNode}
            depth={0}
            path={[item.label]}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
      </div>
    );
  },
});

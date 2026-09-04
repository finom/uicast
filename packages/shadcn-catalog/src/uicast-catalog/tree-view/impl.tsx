import { createComponentImplementation } from "@uicast/react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { iconNode } from "../../lib/icon-node";
import { type TreeNode, TreeViewDef } from "./def";

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
  toggleExpand: (key: string, expanded: boolean) => void;
  onSelect?: (args: { label: string; path: string[] }) => Promise<void>;
  onToggle?: (args: { label: string; expanded: boolean }) => Promise<void>;
}) {
  const key = path.join("/");
  const isExpanded = expandedMap[key] ?? node.expanded ?? false;
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    return (
      <div
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect?.({ label: node.label, path })}
      >
        <span className="w-5" />
        {iconNode(node.icon, "size-4 shrink-0")}
        <span>{node.label}</span>
      </div>
    );
  }

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={(open) => {
        toggleExpand(key, isExpanded);
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
            className="size-5 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        {iconNode(node.icon, "size-4 shrink-0")}
        <span>{node.label}</span>
      </div>
      <CollapsibleContent>
        {(node.children ?? []).map((child, i) => (
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

export const TreeViewImpl = createComponentImplementation({
  def: TreeViewDef,
  render: ({ items = [], onSelect, onToggle}, { entry }) => {
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

    // `expanded` is the effective state (map entry or the node's own prop), so
    // the first toggle of a node the document opened works too
    const toggleExpand = (key: string, expanded: boolean) => {
      setExpandedMap((prev) => ({ ...prev, [key]: !expanded }));
    };

    return (
      <div className="space-y-0.5" data-key={entry.key}>
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

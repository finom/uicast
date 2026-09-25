import { createComponentImplementation } from "@uicast/react";
import { type ReactNode, useState } from "react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";
import { iconNode } from "../../lib/icon-node";
import { blockSkeleton } from "../../lib/skeletons";
import { type TreeNode, TreeViewDef } from "./def";

function TreeNodeComponent({
  node,
  depth,
  path,
  expandedMap,
  setExpanded,
  onSelect,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  path: string[];
  expandedMap: Record<string, boolean>;
  setExpanded: (key: string, expanded: boolean) => void;
  onSelect: (args: { label: string; path: string[] }) => Promise<void>;
  onToggle: (args: { label: string; expanded: boolean }) => Promise<void>;
}) {
  const key = path.join("/");
  const isExpanded = expandedMap[key] ?? node.expanded ?? false;
  const children = node.children ?? [];

  const row = (lead: ReactNode) => (
    <div
      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent cursor-pointer"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onSelect({ label: node.label, path })}
    >
      {lead}
      {iconNode(node.icon, "size-4 shrink-0")}
      <span>{node.label}</span>
    </div>
  );

  if (children.length === 0) return row(<span className="w-5" />);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={(open) => {
        setExpanded(key, open);
        onToggle({ label: node.label, expanded: open });
      }}
    >
      {row(
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-5 p-0" onClick={(e) => e.stopPropagation()}>
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </CollapsibleTrigger>,
      )}
      <CollapsibleContent>
        {children.map((child, i) => (
          <TreeNodeComponent
            key={i}
            node={child}
            depth={depth + 1}
            path={[...path, child.label]}
            expandedMap={expandedMap}
            setExpanded={setExpanded}
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
  render: ({ items, onSelect, onToggle }, { entry }) => {
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
    const setExpanded = (key: string, expanded: boolean) => {
      setExpandedMap((prev) => ({ ...prev, [key]: expanded }));
    };

    return (
      <div className="space-y-0.5" data-key={entry.key}>
        {items.map((item, i) => (
          <TreeNodeComponent
            key={i}
            node={item}
            depth={0}
            path={[item.label]}
            expandedMap={expandedMap}
            setExpanded={setExpanded}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
      </div>
    );
  },
  skeleton: blockSkeleton(240),
});

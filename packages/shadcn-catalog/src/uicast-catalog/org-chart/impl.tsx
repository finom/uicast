import { createComponentImplementation } from "@uicast/react";
import { busy, cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Card } from "../../components/ui/card";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { blockSkeleton } from "../../lib/skeletons";
import { type OrgNode, OrgChartDef } from "./def";

function OrgNodeComponent({
  node,
  onNodeClick,
}: {
  node: OrgNode;
  onNodeClick: (args: { name: string; title?: string }) => Promise<void>;
}) {
  return (
    <div className="flex flex-col items-center">
      <Card
        className="flex flex-col items-center p-3 hover:shadow-md cursor-pointer transition-shadow"
        onClick={() => onNodeClick({ name: node.name, title: node.title })}
      >
        <Avatar className="size-10 mb-1">
          {node.avatar && <AvatarImage src={node.avatar} alt={node.name} />}
          <AvatarFallback className="text-xs">
            {node.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-center">{node.name}</span>
        {node.title && <span className="text-xs text-muted-foreground text-center">{node.title}</span>}
      </Card>
      {node.children && node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-6">
            {node.children.map((child, i) => (
              <div key={i} className="flex flex-col items-center relative">
                <div className="w-px h-4 bg-border" />
                <OrgNodeComponent node={child} onNodeClick={onNodeClick} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const OrgChartImpl = createComponentImplementation({
  def: OrgChartDef,
  render: ({ root, onNodeClick }, { entry, loading }) => (
    <ScrollArea className={cn("py-4", busy(loading))} aria-busy={loading || undefined} data-key={entry.key}>
      <div className="flex justify-center">
        <OrgNodeComponent node={root} onNodeClick={onNodeClick} />
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  skeleton: blockSkeleton(300),
});

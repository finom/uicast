import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ui-fired/catalog/components/ui/avatar";
import { Card } from "@ui-fired/catalog/components/ui/card";
import { ScrollArea, ScrollBar } from "@ui-fired/catalog/components/ui/scroll-area";
import { OrgChartDef } from "./def";

interface OrgNode {
  name: string;
  title?: string;
  avatar?: string;
  children?: OrgNode[];
}

function OrgNodeComponent({
  node,
  onNodeClick,
}: {
  node: OrgNode;
  onNodeClick?: (args: { name: string; title?: string }) => Promise<void>;
}) {
  return (
    <div className="flex flex-col items-center">
      <Card
        className="flex flex-col items-center p-3 hover:shadow-md cursor-pointer transition-shadow"
        onClick={() => onNodeClick?.({ name: node.name, title: node.title })}
      >
        <Avatar className="h-10 w-10 mb-1">
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
        {node.title && (
          <span className="text-xs text-muted-foreground text-center">
            {node.title}
          </span>
        )}
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

export const OrgChartRenderer = createAIComponentRenderer({
  def: OrgChartDef,
  renderer: ({ root, onNodeClick, generatedKey }) => {
    return (
      <ScrollArea className="py-4" data-key={generatedKey}>
        <div className="flex justify-center">
          <OrgNodeComponent node={root as OrgNode} onNodeClick={onNodeClick} />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  },
});

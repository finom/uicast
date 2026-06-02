import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@ui-fired/catalog/components/ui/resizable";
import { ResizablePanelDef } from "./def";
import { Children } from "react";

export const ResizablePanelRenderer = createAIComponentRenderer({
  def: ResizablePanelDef,
  renderer: ({
    direction = "horizontal",
    defaultSize = 50,
    minSize = 20,
    children,
    generatedKey,
  }) => {
    const childArray = Children.toArray(children);
    const firstChild = childArray[0] ?? null;
    const secondChild = childArray.slice(1);

    return (
      <ResizablePanelGroup
        orientation={direction}
        className="min-h-[200px] rounded-lg border"
        data-key={generatedKey}
      >
        <ResizablePanel defaultSize={defaultSize} minSize={minSize}>
          <div className="h-full overflow-auto">{firstChild}</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={100 - defaultSize} minSize={minSize}>
          <div className="h-full overflow-auto">{secondChild}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  },
});

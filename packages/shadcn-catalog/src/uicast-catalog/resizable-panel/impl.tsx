import { createComponentImplementation } from "@uicast/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../components/ui/resizable";
import { ResizablePanelDef } from "./def";
import { Children } from "react";
import { StackSkeleton } from "../../lib/skeletons";

export const ResizablePanelImpl = createComponentImplementation({
  def: ResizablePanelDef,
  render: ({ direction, defaultSize, minSize, children }, { entry }) => {
    const [first, ...rest] = Children.toArray(children);

    // react-resizable-panels reads a bare number as pixels; the def gives percentages.
    return (
      <ResizablePanelGroup
        orientation={direction}
        className="min-h-50 rounded-lg border"
        data-key={entry.key}
      >
        <ResizablePanel defaultSize={`${defaultSize}%`} minSize={`${minSize}%`}>
          <div className="h-full overflow-auto">{first}</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={`${100 - defaultSize}%`} minSize={`${minSize}%`}>
          <div className="h-full overflow-auto">{rest}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  },
  skeleton: StackSkeleton,
});

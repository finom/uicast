import { createComponentImplementation } from "@uicast/react";
import { TabsContent } from "../../components/ui/tabs";
import { StackSkeleton } from "../../lib/skeletons";
import { TabContentDef } from "./def";

export const TabContentImpl = createComponentImplementation({
  def: TabContentDef,
  render: ({ value, children }, { entry }) => (
    <TabsContent value={value} className="flex flex-col gap-4" data-key={entry.key}>
      {children}
    </TabsContent>
  ),
  skeleton: StackSkeleton,
});

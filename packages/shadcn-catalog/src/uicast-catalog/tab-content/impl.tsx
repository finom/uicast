import { createComponentImplementation } from "@uicast/react";
import { TabsContent } from "../../components/ui/tabs";
import { TabContentDef } from "./def";

export const TabContentImpl = createComponentImplementation({
  def: TabContentDef,
  render: ({ value, children}, { entry }) => {
    return (
      <TabsContent value={value} data-key={entry.key}>
        {children}
      </TabsContent>
    );
  },
});

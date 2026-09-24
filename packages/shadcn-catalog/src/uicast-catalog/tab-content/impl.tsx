import { createComponentImplementation } from "@uicast/react";
import { TabsContent } from "../../components/ui/tabs";
import { TabContentDef } from "./def";

export const TabContentImpl = createComponentImplementation({
  def: TabContentDef,
  render: ({ value, children }, { entry }) => {
    return (
      <TabsContent value={value} data-key={entry.key}>
        {children}
      </TabsContent>
    );
  },
  skeleton: ({ children }) => <div className="flex flex-col gap-2">{children}</div>,
});

import { createComponentImplementation } from "@ui-fired/react";
import { TabsContent } from "@ui-fired/catalog/components/ui/tabs";
import { TabContentDef } from "./def";

export const TabContentImpl = createComponentImplementation({
  def: TabContentDef,
  render: ({ value, children, generatedKey }) => {
    return (
      <TabsContent value={value} data-key={generatedKey}>
        {children}
      </TabsContent>
    );
  },
});

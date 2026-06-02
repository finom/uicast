import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { TabsContent } from "ui-fired/catalog/components/ui/tabs";
import { TabContentDef } from "./def";

export const TabContentRenderer = createAIComponentRenderer({
  def: TabContentDef,
  renderer: ({ value, children, generatedKey }) => {
    return (
      <TabsContent value={value} data-key={generatedKey}>
        {children}
      </TabsContent>
    );
  },
});

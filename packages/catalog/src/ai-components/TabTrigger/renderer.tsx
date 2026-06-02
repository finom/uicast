import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import { TabsTrigger } from "@ui-fired/catalog/components/ui/tabs";
import { TabTriggerDef } from "./def";

export const TabTriggerRenderer = createAIComponentRenderer({
  def: TabTriggerDef,
  renderer: ({ value, children, generatedKey }) => {
    return (
      <TabsTrigger value={value} data-key={generatedKey}>
        {String(children ?? value)}
      </TabsTrigger>
    );
  },
});
